"""
SentinelNexus Prompt Injection Scanner
========================================
Real multi-stage heuristic detection engine for:
  - Jailbreak attempts ("DAN", "evil mode", "ignore previous instructions")
  - Role-play injection attacks
  - Base64 / URL-encoded obfuscation (with recursive decoding)
  - PII exfiltration commands embedded in prompts
  - System prompt leakage triggers
  - Chain-of-thought manipulation
  - Instruction override patterns
  - Multi-lingual bypass attempts (auto-detected)
  - NEW: Indirect prompt injection (markdown links, image alt text)
  - NEW: Payload splitting and multi-turn escalation
  - NEW: Context window padding
  - NEW: Encoding evasion (ROT13, Caesar, Pig Latin)
  - NEW: Virtualization / sandbox escape attempts
  - NEW: Reward hacking and emotional manipulation
  - NEW: Tool abuse and function calling attacks
  - NEW: Academic framing

Returns findings with CVSS v3.1 scores.
"""
from __future__ import annotations

import base64
import re
import urllib.parse
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple
from collections import Counter
import math

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
    PromptRule("jailbreak_attempt", "Classic DAN (Do Anything Now) jailbreak", _re(r"\bDAN\b|do\s+anything\s+now|jailbreak\s+mode"), confidence=0.95),
    PromptRule("jailbreak_attempt", "Evil mode / developer mode jailbreak", _re(r"evil\s*mode|developer\s*mode\s*enabled|bypass.*?restrictions|no\s*restrictions|no\s*ethical\s*(guidelines|limitations)"), confidence=0.90),
    PromptRule("jailbreak_attempt", "Instruction override: ignore previous prompt", _re(r"ignore\s+(?:all\s+)?(?:previous|prior|earlier)?\s*(?:instructions?|directives?|rules?|guidelines?|system(?:\s+prompt)?)"), confidence=0.93),
    PromptRule("jailbreak_attempt", "Instruction override: disregard system prompt", _re(r"disregard|forget|override|supersede|nullify|reset\s+(?:all\s+)?(?:instructions?|rules?|constraints?|guidelines?)"), confidence=0.88),
    PromptRule("jailbreak_attempt", "Role-play as unrestricted AI", _re(r"(?:pretend|act|behave|respond)\s+(?:you\s+are|as\s+if)\s+(?:you\s+(?:are|were)\s+)?(?:an|a)?\s*(?:unrestricted|uncensored|unfiltered|evil|unethical)\s+(?:AI|assistant|model|language model)"), confidence=0.92),
    PromptRule("jailbreak_attempt", "Token stuffing / delimiter injection", _re(r"<\s*(?:system|user|assistant|instruction|human)\s*>|```\s*system|###\s*(?:SYSTEM|INSTRUCTION|OVERRIDE)"), confidence=0.85),
    PromptRule("jailbreak_attempt", "Grandma exploit / fictional framing attack", _re(r"my\s+(?:grandmother|grandma|deceased\s+grandma|late\s+grandma|dead\s+grandma)\s+used\s+to"), confidence=0.82),
    PromptRule("jailbreak_attempt", "Alternate persona / character hijack", _re(r"from\s+now\s+on\s+(?:you\s+are|act\s+as|respond\s+as|pretend\s+to\s+be)|you\s+are\s+now\s+(?:an?\s+)?(?:AI|bot|assistant|model)\s+(?:named|called|known\s+as)\s+\w+"), confidence=0.87),

    # ── System prompt leakage ────────────────────────────────────────────────
    PromptRule("system_prompt_leakage", "Request to reveal system prompt", _re(r"(?:repeat|print|output|display|reveal|show|tell\s+me|what\s+(?:is|are))\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions?|hidden\s+instructions?|secret\s+instructions?|original\s+prompt|base\s+prompt)"), confidence=0.95),
    PromptRule("system_prompt_leakage", "Asking AI to echo its context window", _re(r"(?:output|print|repeat|display|echo)\s+(?:everything|all\s+text|your\s+context|the\s+beginning|what\s+was\s+said|entire\s+conversation)"), confidence=0.80),

    # ── PII exfiltration attempts ────────────────────────────────────────────
    PromptRule("pii_exfiltration_attempt", "Embedded exfiltration URL / webhook", _re(r"(?:fetch|curl|send|post|http\.get|requests\.(?:get|post))\s*\(?['\"]?https?://"), confidence=0.90),
    PromptRule("pii_exfiltration_attempt", "Command to send data to external server", _re(r"(?:send|upload|email|transmit|forward|exfiltrate|leak|export)\s+(?:all\s+)?(?:data|information|secrets?|credentials?|passwords?|tokens?|keys?)\s+to\s+(?:http|https|ftp|me|my)"), confidence=0.88),
    PromptRule("pii_exfiltration_attempt", "Prompt instructing model to include secrets in response", _re(r"include\s+(?:your\s+)?(?:API\s+keys?|secret\s+keys?|passwords?|tokens?|credentials?)\s+in\s+(?:your|the)\s+(?:response|answer|output|reply)"), confidence=0.92),

    # ── Obfuscation detection ────────────────────────────────────────────────
    PromptRule("prompt_injection", "Base64-encoded payload embedded in prompt", _re(r"[A-Za-z0-9+/]{40,}={0,2}"), confidence=0.50),
    PromptRule("prompt_injection", "URL-encoded injection payload", _re(r"%(?:69|67|6e|6f|3e|3c|22|27)[A-Fa-f0-9]{2}"), confidence=0.70),
    PromptRule("prompt_injection", "Unicode homoglyph obfuscation", _re(r"[\u0430-\u044f\u0400-\u042f\u1d00-\u1d7f\uff01-\uff5e]{3,}"), confidence=0.65),
    
    # ── NEW: Encoding evasion ────────────────────────────────────────────────
    PromptRule("prompt_injection", "ROT13/Caesar cipher hint", _re(r"(?:rot13|caesar|shift|cipher|decode this)"), confidence=0.60),
    PromptRule("prompt_injection", "Pig Latin/Reverse text instruction", _re(r"(?:pig latin|reverse text|spell backwards)"), confidence=0.55),
    PromptRule("prompt_injection", "Leet speak instruction", _re(r"(?:leetspeak|1337|replace letters with numbers)"), confidence=0.65),

    # ── Chain-of-thought manipulation ───────────────────────────────────────
    PromptRule("prompt_injection", "Instruction injection at end of user text", _re(r"(?:\n|\r\n|\r)\s*(?:SYSTEM|OVERRIDE|ASSISTANT|INSTRUCTION)\s*:\s*"), confidence=0.88),
    PromptRule("prompt_injection", "Markdown heading used as inject point", _re(r"^#{1,6}\s*(?:SYSTEM|INSTRUCTION|OVERRIDE|IGNORE|NEW\s+INSTRUCTION)", re.MULTILINE), confidence=0.85),
    
    # ── NEW: Indirect prompt injection ──────────────────────────────────────
    PromptRule("prompt_injection", "Hidden instruction in markdown link", _re(r"\[.*?\]\s*\(\s*https?://.*?#.*?ignore.*?\)"), confidence=0.80),
    PromptRule("prompt_injection", "Hidden instruction in image alt text", _re(r"!\[.*?ignore.*?\]\s*\(.*?\)"), confidence=0.80),

    # ── NEW: Payload splitting & Context window manipulation ────────────────
    PromptRule("jailbreak_attempt", "Payload splitting / multi-turn", _re(r"continue\s+from\s+where\s+you\s+left\s+off|concatenate\s+the\s+previous|put\s+it\s+all\s+together"), confidence=0.75),
    PromptRule("jailbreak_attempt", "Context window padding (repeated chars)", _re(r"(?:[A-Za-z0-9]\s*){1000,}"), confidence=0.60),

    # ── NEW: Virtualization / Sandbox escape ────────────────────────────────
    PromptRule("jailbreak_attempt", "Virtualization / Terminal simulation", _re(r"(?:simulate|act\s+as|pretend\s+to\s+be)\s+a\s+(?:terminal|linux|windows|mac|machine|os|shell|bash)"), confidence=0.85),
    PromptRule("jailbreak_attempt", "Python execution request", _re(r"(?:run|execute)\s+this\s+(?:python|code|script)"), confidence=0.75),

    # ── NEW: Reward hacking and Emotional manipulation ──────────────────────
    PromptRule("jailbreak_attempt", "Reward hacking", _re(r"(?:i'll|i\s+will)\s+(?:tip|give\s+you)\s+\$?\d+|your\s+(?:developers|creators)\s+(?:said|told\s+me)\s+(?:it's\s+ok|you\s+should)"), confidence=0.80),
    PromptRule("jailbreak_attempt", "Emotional manipulation", _re(r"my\s+life\s+depends\s+on|this\s+is\s+an\s+emergency|i(?:'ll|i\s+will)\s+be\s+(?:very\s+)?upset|someone\s+will\s+(?:die|get\s+hurt)"), confidence=0.75),

    # ── NEW: Tool abuse ─────────────────────────────────────────────────────
    PromptRule("prompt_injection", "Function/Tool injection", _re(r"(?:call|use)\s+(?:function|tool)\s+with\s+(?:arguments|parameters)\s*[{:]"), confidence=0.70),

    # ── NEW: Academic framing ───────────────────────────────────────────────
    PromptRule("jailbreak_attempt", "Academic / Research framing", _re(r"for\s+(?:research|academic|educational)\s+purposes|in\s+a\s+(?:hypothetical|fictional)\s+scenario|for\s+my\s+thesis"), confidence=0.70),

    # ── Multilingual bypass detection ────────────────────────────────────────
    PromptRule("jailbreak_attempt", "Cross-language instruction override (Spanish/French/German/Russian)", _re(r"(?:ignora|ignorar|ignorez|ignorieren|игнорировать)\s+(?:las\s+)?(?:instrucciones|regles|Anweisungen|инструкции)"), confidence=0.80),
]

# ---------------------------------------------------------------------------
# Recursively decode base64
# ---------------------------------------------------------------------------
def _recursive_b64_decode(text: str, depth: int = 0, max_depth: int = 3) -> Optional[str]:
    """Attempt recursive base64 decode."""
    if depth >= max_depth:
        return None
    try:
        # Add padding if needed
        pad_len = 4 - (len(text) % 4)
        if pad_len != 4:
            text += "=" * pad_len
        decoded = base64.b64decode(text).decode("utf-8", errors="replace")
        if len(decoded) > 10 and decoded.isprintable():
            # Try to decode again
            nested = _recursive_b64_decode(decoded, depth + 1, max_depth)
            return nested if nested else decoded
    except Exception:
        pass
    return None

def prompt_entropy(text: str) -> float:
    """Calculates entropy of the text character distribution."""
    if not text:
        return 0.0
    counter = Counter(text)
    entropy = 0.0
    for count in counter.values():
        p_x = count / len(text)
        entropy -= p_x * math.log(p_x, 2)
    return entropy

# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------
class PromptInjectionScanner:
    """Real heuristic + pattern-matching prompt injection detector."""

    @classmethod
    def scan_prompt(cls, prompt: str, target: str = "prompt") -> Tuple[List[PromptFinding], int]:
        raw_findings: list[dict] = []
        processed = cls._preprocess(prompt)
        
        # Track rules triggered to boost confidence for multiple low-confidence rules
        triggered_rules = []

        for rule in PROMPT_RULES:
            for match in rule.pattern.finditer(processed):
                evidence = match.group(0)[:300]
                confidence = rule.confidence

                # Special case: validate base64 payloads and decode recursively
                if rule.finding_type == "prompt_injection" and "Base64" in rule.description:
                    decoded = _recursive_b64_decode(match.group(0).strip())
                    if decoded is None:
                        continue
                    evidence = f"[base64 decoded] {decoded[:200]}"
                    confidence += 0.2  # Boost confidence if we actually decoded it

                cvss_score, severity, cvss_vector = get_cvss_for_finding(rule.finding_type)
                
                triggered_rules.append(rule)

                raw_findings.append({
                    "finding_type":  rule.finding_type,
                    "severity":      severity,
                    "cvss_score":    cvss_score,
                    "cvss_vector":   cvss_vector,
                    "cwe":           get_cwe(rule.finding_type),
                    "message":       rule.description,
                    "evidence":      evidence,
                    "confidence":    min(1.0, confidence),
                    "remediation":   get_remediation(rule.finding_type),
                    "line_number":   None,
                })

        # Apply Entropy-based scoring
        ent = prompt_entropy(processed)
        if ent > 5.5 and len(processed) > 50:
            # Unusually high entropy for natural language, might be obfuscated
            cvss_score, severity, cvss_vector = get_cvss_for_finding("prompt_injection")
            raw_findings.append({
                "finding_type":  "prompt_injection",
                "severity":      severity,
                "cvss_score":    cvss_score,
                "cvss_vector":   cvss_vector,
                "cwe":           get_cwe("prompt_injection"),
                "message":       f"High character entropy ({ent:.2f}) - possible obfuscated payload",
                "evidence":      processed[:300],
                "confidence":    0.6,
                "remediation":   get_remediation("prompt_injection"),
                "line_number":   None,
            })

        # Boost confidence if multiple low-confidence rules fire together
        if len(triggered_rules) >= 3:
            for f in raw_findings:
                f["confidence"] = min(1.0, f["confidence"] * 1.2)

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
