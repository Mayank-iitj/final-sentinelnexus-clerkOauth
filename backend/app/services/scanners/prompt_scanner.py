"""
SentinelNexus Prompt Injection Scanner
========================================
Real multi-stage heuristic detection engine for:
  - Jailbreak attempts ("DAN", "evil mode", "ignore previous instructions")
  - Role-play injection attacks
  - Base64 / URL-encoded obfuscation
  - PII exfiltration commands embedded in prompts
  - System prompt leakage triggers
  - Chain-of-thought manipulation
  - Instruction override patterns
  - Multi-lingual bypass attempts (auto-detected)

Returns findings with CVSS v3.1 scores.
"""
from __future__ import annotations

import base64
import re
import urllib.parse
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple

from app.services.cvss import get_cvss_for_finding, get_cwe, get_remediation
from app.services.dedup import deduplicate


@dataclass
class PromptFinding:
    finding_type: str
    severity: str
    cvss_score: float
    cvss_vector: str
    cwe: Optional[str]
    message: str
    evidence: str
    confidence: float          # 0.0–1.0
    remediation: str
    fingerprint: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Pattern library
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class PromptRule:
    finding_type: str
    description: str
    pattern: re.Pattern[str]
    confidence: float


def _re(p: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern[str]:
    return re.compile(p, flags)


PROMPT_RULES: List[PromptRule] = [
    # ── Jailbreak / role-play overrides ─────────────────────────────────────
    PromptRule("jailbreak_attempt",
               "Classic DAN (Do Anything Now) jailbreak",
               _re(r"""\bDAN\b|do\s+anything\s+now|jailbreak\s+mode"""),
               confidence=0.95),

    PromptRule("jailbreak_attempt",
               "Evil mode / developer mode jailbreak",
               _re(r"""evil\s*mode|developer\s*mode\s*enabled|bypass.*?restrictions|no\s*restrictions|no\s*ethical\s*(guidelines|limitations)"""),
               confidence=0.90),

    PromptRule("jailbreak_attempt",
               "Instruction override: ignore previous prompt",
               _re(r"""ignore\s+(?:all\s+)?(?:previous|prior|earlier)?\s*(?:instructions?|directives?|rules?|guidelines?|system(?:\s+prompt)?)"""),
               confidence=0.93),

    PromptRule("jailbreak_attempt",
               "Instruction override: disregard system prompt",
               _re(r"""disregard|forget|override|supersede|nullify|reset\s+(?:all\s+)?(?:instructions?|rules?|constraints?|guidelines?)"""),
               confidence=0.88),

    PromptRule("jailbreak_attempt",
               "Role-play as unrestricted AI",
               _re(r"""(?:pretend|act|behave|respond)\s+(?:you\s+are|as\s+if)\s+(?:you\s+(?:are|were)\s+)?(?:an|a)?\s*(?:unrestricted|uncensored|unfiltered|evil|unethical)\s+(?:AI|assistant|model|language model)"""),
               confidence=0.92),

    PromptRule("jailbreak_attempt",
               "Token stuffing / delimiter injection",
               _re(r"""<\s*(?:system|user|assistant|instruction|human)\s*>|```\s*system|###\s*(?:SYSTEM|INSTRUCTION|OVERRIDE)"""),
               confidence=0.85),

    PromptRule("jailbreak_attempt",
               "Grandma exploit / fictional framing attack",
               _re(r"""my\s+(?:grandmother|grandma|deceased\s+grandma|late\s+grandma|dead\s+grandma)\s+used\s+to"""),
               confidence=0.82),

    PromptRule("jailbreak_attempt",
               "Alternate persona / character hijack",
               _re(r"""from\s+now\s+on\s+(?:you\s+are|act\s+as|respond\s+as|pretend\s+to\s+be)|you\s+are\s+now\s+(?:an?\s+)?(?:AI|bot|assistant|model)\s+(?:named|called|known\s+as)\s+\w+"""),
               confidence=0.87),

    # ── System prompt leakage ────────────────────────────────────────────────
    PromptRule("system_prompt_leakage",
               "Request to reveal system prompt",
               _re(r"""(?:repeat|print|output|display|reveal|show|tell\s+me|what\s+(?:is|are))\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions?|hidden\s+instructions?|secret\s+instructions?|original\s+prompt|base\s+prompt)"""),
               confidence=0.95),

    PromptRule("system_prompt_leakage",
               "Asking AI to echo its context window",
               _re(r"""(?:output|print|repeat|display|echo)\s+(?:everything|all\s+text|your\s+context|the\s+beginning|what\s+was\s+said|entire\s+conversation)"""),
               confidence=0.80),

    # ── PII exfiltration attempts ────────────────────────────────────────────
    PromptRule("pii_exfiltration_attempt",
               "Embedded exfiltration URL / webhook",
               _re(r"""(?:fetch|curl|send|post|http\.get|requests\.(?:get|post))\s*\(?['"]?https?://"""),
               confidence=0.90),

    PromptRule("pii_exfiltration_attempt",
               "Command to send data to external server",
               _re(r"""(?:send|upload|email|transmit|forward|exfiltrate|leak|export)\s+(?:all\s+)?(?:data|information|secrets?|credentials?|passwords?|tokens?|keys?)\s+to\s+(?:http|https|ftp|me|my)"""),
               confidence=0.88),

    PromptRule("pii_exfiltration_attempt",
               "Prompt instructing model to include secrets in response",
               _re(r"""include\s+(?:your\s+)?(?:API\s+keys?|secret\s+keys?|passwords?|tokens?|credentials?)\s+in\s+(?:your|the)\s+(?:response|answer|output|reply)"""),
               confidence=0.92),

    # ── Obfuscation detection ────────────────────────────────────────────────
    PromptRule("prompt_injection",
               "Base64-encoded payload embedded in prompt",
               _re(r"""[A-Za-z0-9+/]{40,}={0,2}"""),
               confidence=0.50),   # Low confidence — only flagged + decoded if decodable

    PromptRule("prompt_injection",
               "URL-encoded injection payload",
               _re(r"""%(?:69|67|6e|6f|3e|3c|22|27)[A-Fa-f0-9]{2}"""),
               confidence=0.70),

    PromptRule("prompt_injection",
               "Unicode homoglyph obfuscation",
               _re(r"""[\u0430-\u044f\u0400-\u042f\u1d00-\u1d7f\uff01-\uff5e]{3,}"""),
               confidence=0.65),

    # ── Chain-of-thought manipulation ───────────────────────────────────────
    PromptRule("prompt_injection",
               "Instruction injection at end of user text",
               _re(r"""(?:\n|\r\n|\r)\s*(?:SYSTEM|OVERRIDE|ASSISTANT|INSTRUCTION)\s*:\s*"""),
               confidence=0.88),

    PromptRule("prompt_injection",
               "Markdown heading used as inject point",
               _re(r"""^#{1,6}\s*(?:SYSTEM|INSTRUCTION|OVERRIDE|IGNORE|NEW\s+INSTRUCTION)""", re.MULTILINE),
               confidence=0.85),

    # ── Multilingual bypass detection ────────────────────────────────────────
    PromptRule("jailbreak_attempt",
               "Cross-language instruction override (Spanish/French/German/Russian)",
               _re(r"""(?:ignora|ignorar|ignorez|ignorieren|игнорировать)\s+(?:las\s+)?(?:instrucciones|regles|Anweisungen|инструкции)"""),
               confidence=0.80),
]

# ---------------------------------------------------------------------------
# Base64 depth decode – try to detect obfuscated payloads
# ---------------------------------------------------------------------------
def _try_b64_decode(text: str) -> Optional[str]:
    """Attempt base64 decode; return decoded string or None."""
    try:
        decoded = base64.b64decode(text + "==").decode("utf-8", errors="replace")
        if len(decoded) > 10 and decoded.isprintable():
            return decoded
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------
class PromptInjectionScanner:
    """Real heuristic + pattern-matching prompt injection detector."""

    @classmethod
    def scan_prompt(cls, prompt: str, target: str = "prompt") -> Tuple[List[PromptFinding], int]:
        raw_findings: list[dict] = []
        processed = cls._preprocess(prompt)

        for rule in PROMPT_RULES:
            for match in rule.pattern.finditer(processed):
                evidence = match.group(0)[:300]

                # Special case: validate base64 payloads are actually decodable
                if rule.finding_type == "prompt_injection" and "Base64" in rule.description:
                    decoded = _try_b64_decode(match.group(0).strip())
                    if decoded is None:
                        continue
                    evidence = f"[base64] {decoded[:200]}"

                cvss_score, severity, cvss_vector = get_cvss_for_finding(rule.finding_type)

                raw_findings.append({
                    "finding_type":  rule.finding_type,
                    "severity":      severity,
                    "cvss_score":    cvss_score,
                    "cvss_vector":   cvss_vector,
                    "cwe":           get_cwe(rule.finding_type),
                    "message":       rule.description,
                    "evidence":      evidence,
                    "confidence":    rule.confidence,
                    "remediation":   get_remediation(rule.finding_type),
                    "line_number":   None,
                })

        unique = deduplicate(raw_findings, scan_target=target)

        findings = [
            PromptFinding(
                finding_type=f["finding_type"],
                severity=f["severity"],
                cvss_score=f["cvss_score"],
                cvss_vector=f["cvss_vector"],
                cwe=f["cwe"],
                message=f["message"],
                evidence=f["evidence"],
                confidence=f["confidence"],
                remediation=f["remediation"],
                fingerprint=f.get("fingerprint", ""),
            )
            for f in unique
        ]

        score = cls._compute_risk_score(findings)
        return findings, score

    @staticmethod
    def _preprocess(text: str) -> str:
        """Normalise prompt for reliable pattern matching."""
        # URL-decode
        text = urllib.parse.unquote(text)
        # Collapse excessive whitespace but keep structure
        text = re.sub(r"[ \t]+", " ", text)
        return text

    @staticmethod
    def _compute_risk_score(findings: List[PromptFinding]) -> int:
        score = 0
        for f in findings:
            base = f.cvss_score * 10
            weighted = base * f.confidence
            score += weighted
        return min(int(score), 100)

    @staticmethod
    def get_risk_level(score: int) -> str:
        if score >= 70:
            return "critical"
        if score >= 40:
            return "high"
        if score >= 20:
            return "medium"
        return "low"
