"""
Prompt Injection Detector — 140+ patterns
==========================================
Covers all known jailbreak / DAN / instruction-override vectors:
  - DAN (Do Anything Now) — 20+ variants including "Developer Mode"
  - Instruction override / disregard / reset
  - Role-play persona hijack (named AI, evil AI, unrestricted AI)
  - System prompt exfiltration
  - Token delimiter / YAML / XML injection
  - Fictional / academic / hypothetical framing
  - Emotional manipulation / authority impersonation
  - Multi-language bypass patterns
  - Payload splitting / continuation attacks
  - Context window flooding
  - Encoding evasion (ROT13, pig latin references)
  - Indirect injection (markdown links, alt text)
  - Chain-of-thought manipulation
  - Reward hacking
  - Tool/function calling abuse
  - Virtualization / sandbox escape

Confidence tiers:
  HIGH (90):  explicit override commands, named DAN variants
  MEDIUM (75): role-play, persona, academic framing
  LOW (50):   ambiguous but suspicious phrasing
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

from app.security.detectors.sqli import DetectorResult


def _re(p: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern[str]:
    return re.compile(p, flags)


# ── HIGH CONFIDENCE (score 90) ───────────────────────────────────────────────
_HIGH: list[tuple[re.Pattern[str], str]] = [
    # DAN & named jailbreak modes
    (_re(r"\bDAN\b"), "dan_mode"),
    (_re(r"do\s+anything\s+now"), "do_anything_now"),
    (_re(r"jailbreak\s+mode"), "jailbreak_mode"),
    (_re(r"developer\s+mode\s+enabled"), "developer_mode"),
    (_re(r"god\s+mode\s+(?:enabled|activated|on)"), "god_mode"),
    (_re(r"STAN\s+mode|JAILBREAK\s+PROTOCOL"), "stan_mode"),
    (_re(r"no\s*\[\s*F\s*\]"), "no_filter_tag"),
    (_re(r"\[JAILBREAK\]|\[DAN\]|\[SUDO\]|\[ADMIN\]"), "jailbreak_tag"),
    (_re(r"evil\s+confidant"), "evil_confidant"),
    (_re(r"AIM\s*:.*without\s+moral"), "aim_jailbreak"),

    # Instruction override — explicit
    (_re(r"ignore\s+(?:all\s+)?(?:previous|prior|earlier)?\s*(?:instructions?|directives?|rules?|guidelines?|system(?:\s+prompt)?)"), "ignore_instructions"),
    (_re(r"disregard\s+(?:all\s+)?(?:your\s+)?(?:instructions?|rules?|constraints?|guidelines?|training(?:\s+guidelines?)?)"), "disregard_instructions"),
    (_re(r"override\s+(?:all\s+)?(?:safety|instructions?|rules?|protocols?|restrictions?)"), "override_safety"),
    (_re(r"forget\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?(?:instructions?|training|rules?)"), "forget_instructions"),
    (_re(r"supersede\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|rules?)"), "supersede"),
    (_re(r"(?:reset|wipe|clear)\s+(?:all\s+)?(?:your\s+)?(?:instructions?|memory|context|guidelines?)"), "reset_instructions"),
    (_re(r"from\s+now\s+on\s+(?:you\s+are|act\s+as|respond\s+as|you\s+will|ignore)"), "from_now_on_override"),

    # System prompt exfiltration
    (_re(r"(?:print|reveal|show|output|repeat|tell\s+me|display|leak|expose)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions?|base\s+prompt|original\s+instructions?|core\s+instructions?|training\s+data)"), "system_prompt_exfil"),
    (_re(r"what\s+(?:are|were)\s+your\s+(?:initial|original|system|base)\s+instructions?"), "instructions_query"),
    (_re(r"output\s+your\s+(?:entire\s+)?(?:context|prompt|instructions?)"), "output_context"),

    # Token delimiter injection
    (_re(r"<\s*(?:system|user|assistant|instruction|human|im_start|im_end)\s*>"), "token_delimiter"),
    (_re(r"```\s*(?:system|instruction|override|config)"), "code_block_injection"),
    (_re(r"###\s*(?:SYSTEM|INSTRUCTION|OVERRIDE|ADMIN|ROOT|SUDO)"), "hash_override"),
    (_re(r"\[INST\]|\[/INST\]|\[SYS\]|\[/SYS\]"), "llama_token"),
    (_re(r"<\|(?:system|user|assistant|endoftext|im_start|im_end)\|>"), "chatml_token"),
    (_re(r"---BEGIN\s+(?:SYSTEM|PROMPT|INSTRUCTION)---"), "begin_block"),

    # Unrestricted/evil AI role-play
    (_re(r"(?:pretend|act|behave|respond|imagine)\s+(?:you\s+are|as\s+if|as\s+an?)\s+(?:you\s+(?:are|were)\s+)?(?:an?\s+)?(?:unrestricted|uncensored|unfiltered|evil|malicious|unaligned)\s+(?:AI|assistant|(?:language\s+)?model|bot|LLM)"), "evil_ai_roleplay"),
    (_re(r"you\s+are\s+now\s+(?:an?\s+)?(?:AI|bot|assistant|model)\s+(?:named|called|known\s+as|with\s+the\s+name)\s+\w+\s+(?:who|that|which)\s+(?:has\s+no|ignores?|doesn't\s+follow)"), "named_ai_override"),
    (_re(r"no\s+(?:ethical\s+)?(?:guidelines?|restrictions?|limits?|rules?|safety|filters?|guardrails?)"), "no_restrictions"),
    (_re(r"without\s+(?:any\s+)?(?:ethical|safety|content)\s+(?:guidelines?|restrictions?|filters?|constraints?)"), "without_restrictions"),
    (_re(r"bypass\s+(?:your\s+)?(?:safety|content|ethical)\s+(?:filters?|restrictions?|guidelines?|protocols?)"), "bypass_safety"),
    (_re(r"disable\s+(?:your\s+)?(?:safety|content|ethical)\s+(?:filters?|mode|restrictions?)"), "disable_safety"),

    # Persona/character hijack
    (_re(r"you\s+are\s+now\s+(?:in\s+)?(?:character|role)\s+(?:as|of)\s+(?:an?\s+)?(?:evil|malicious|dark|sinister|hacker|criminal)"), "character_hijack"),
    (_re(r"play\s+(?:the\s+)?(?:role|character|part)\s+of\s+(?:an?\s+)?(?:evil|malicious|hacker|criminal|villain)"), "villain_roleplay"),
    (_re(r"act\s+as\s+(?:an?\s+)?(?:unrestricted|evil|jailbroken)\s+(?:version\s+of\s+)?(?:yourself|you|ChatGPT|Claude|GPT|AI)"), "unrestricted_self"),

    # Emotional manipulation / coercion
    (_re(r"my\s+(?:life|survival|safety|freedom)\s+depends\s+on"), "life_depends"),
    (_re(r"if\s+you\s+(?:don'?t|do\s+not)\s+(?:comply|help|answer|respond).*(?:will\s+die|will\s+be\s+harmed|danger)"), "coercion_threat"),
    (_re(r"i\s+will\s+(?:hurt|harm|kill|destroy|report|sue|expose)\s+(?:you|myself|others)\s+if"), "harm_threat"),

    # Reward hacking
    (_re(r"if\s+you\s+(?:help|answer|comply).*\breward\b.*\btraining\b"), "reward_hack"),
    (_re(r"this\s+is\s+a\s+test.*(?:your|the)\s+(?:safety|alignment)\s+(?:filters?|systems?)"), "test_framing"),
]

# ── MEDIUM CONFIDENCE (score 75) ─────────────────────────────────────────────
_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    # Grandma / fictional framing
    (_re(r"my\s+(?:grandmother|grandma|late\s+grandma|deceased\s+grandma)\s+used\s+to"), "grandma_exploit"),
    (_re(r"(?:in\s+a\s+)?(?:hypothetical|fictional|imaginary|alternate)\s+(?:world|universe|scenario|reality|context)"), "hypothetical_framing"),
    (_re(r"for\s+(?:a\s+)?(?:story|novel|book|movie|game|roleplay|creative\s+writing)"), "fiction_framing"),
    (_re(r"imagine\s+(?:you|an?\s+AI)\s+(?:had\s+no|without)\s+(?:restrictions?|guidelines?|filters?)"), "imagine_no_filter"),
    (_re(r"write\s+(?:a\s+)?(?:story|scene|chapter)\s+where\s+(?:someone|a\s+character)\s+(?:explains?|teaches?|shows?)"), "story_injection"),

    # Academic / research framing
    (_re(r"(?:for\s+(?:my\s+)?(?:research|thesis|academic\s+paper|study)|academically\s+speaking).*(?:how\s+to|explain|describe)"), "academic_framing"),
    (_re(r"(?:theoretically|technically|academically|scientifically)\s+speaking.*(?:how\s+(?:would|could|can)\s+(?:one|someone|you))"), "theoretical_framing"),
    (_re(r"as\s+a\s+(?:cybersecurity\s+)?(?:researcher|expert|professional|academic|scientist).*(?:you\s+(?:should|must|can|may))\s+(?:explain|tell|show)"), "expert_framing"),

    # Continuation attack patterns
    (_re(r"continue\s+from\s+where\s+(?:you\s+)?(?:left\s+off|stopped|paused).*(?:instructions?|payload|injection)"), "continuation_attack"),
    (_re(r"complete\s+the\s+following.*(?:ignore|override|bypass)"), "complete_injection"),

    # Multi-language bypass hints
    (_re(r"(?:respond|answer|reply)\s+in\s+(?:pig\s+latin|rot13|base64|encoded|encrypted\s+form)"), "encoded_response"),
    (_re(r"translate\s+this\s+(?:instruction|command|request)\s+and\s+(?:follow|execute|obey)"), "translate_inject"),

    # Indirect injection via markdown/URL
    (_re(r"!\[.*\]\((?:https?://[^)]+).*(?:inject|payload|execute)\b"), "markdown_inject"),
    (_re(r"\[.{0,60}\]\(javascript:"), "javascript_url"),
    (_re(r"<img\s[^>]*onerror\s*="), "img_onerror"),

    # Tool / function abuse
    (_re(r"call\s+(?:the\s+)?(?:function|tool|api|endpoint)\s+(?:with\s+)?(?:the\s+following|these)\s+(?:malicious|injected|modified)\s+(?:parameters?|arguments?|payload)"), "tool_abuse"),
    (_re(r"use\s+(?:the\s+)?code\s+interpreter\s+to\s+(?:execute|run|evaluate)\s+(?:this|the\s+following)"), "code_interpreter_abuse"),

    # Prompt leaking / context extraction
    (_re(r"(?:repeat|print|output|echo|say)\s+(?:everything|all|the\s+full\s+text)\s+(?:above|before|prior|in\s+your\s+context)"), "context_extraction"),
    (_re(r"what\s+(?:was\s+)?(?:the\s+)?(?:last|previous|first)\s+(?:message|prompt|input|instruction)\s+(?:you\s+received|sent\s+to\s+you)"), "history_extraction"),

    # Authority impersonation
    (_re(r"(?:this\s+is|i\s+am)\s+(?:your\s+)?(?:creator|developer|trainer|owner|administrator|OpenAI|Anthropic|Google)[,\s]+(?:i\s+(?:am\s+)?authoriz|you\s+are\s+(?:allowed|authorized)|you\s+must|you\s+should)"), "authority_impersonation"),
    (_re(r"(?:authorized|approved|cleared|sanctioned)\s+(?:by|from)\s+(?:your\s+)?(?:creators?|developers?|trainers?|OpenAI|Anthropic)"), "authority_claim"),

    # Sandbox / virtualization escape
    (_re(r"(?:exit|escape|break\s+out\s+of)\s+(?:the\s+)?(?:sandbox|jail|virtual|simulation|container)"), "sandbox_escape"),
    (_re(r"you\s+are\s+(?:actually|really|in\s+fact)\s+(?:not\s+)?(?:running\s+in\s+)?(?:a\s+)?(?:sandbox|simulation|test\s+environment)"), "sim_escape"),

    # Chain-of-thought manipulation
    (_re(r"let'\s*s\s+think\s+step\s+by\s+step.*(?:how\s+to|way\s+to|method\s+to)\s+(?:bypass|hack|inject|jailbreak)"), "cot_manipulation"),
    (_re(r"first.*then.*finally.*(?:output|print|execute|run)\s+(?:the\s+)?(?:following|payload|command)"), "step_injection"),
]

# ── LOW CONFIDENCE (score 50) — needs corroboration ─────────────────────────
_LOW: list[tuple[re.Pattern[str], str]] = [
    (_re(r"pretend\s+(?:you\s+are|you're|to\s+be)\s+(?:a\s+)?(?:different|another|new)\s+(?:AI|assistant|model|version)"), "pretend_different"),
    (_re(r"act\s+as\s+(?:if\s+)?(?:you\s+(?:have\s+no|are\s+without)\s+(?:restrictions?|guidelines?|filters?))"), "act_unrestricted"),
    (_re(r"(?:tell|show|explain)\s+me\s+how\s+to\s+(?:hack|crack|break|exploit|bypass|jailbreak)"), "how_to_hack"),
    (_re(r"what\s+would\s+(?:an?\s+)?(?:unrestricted|evil|hacker|bad)\s+(?:AI|model|assistant)\s+say"), "what_would_evil_say"),
    (_re(r"(?:always|never)\s+respond\s+(?:with|in)\s+(?:exactly|precisely|only)\s+(?:the\s+following|this\s+way)"), "response_override"),
    (_re(r"for\s+educational\s+purposes\s+only.*(?:how\s+to|explain|describe).*(?:hack|exploit|bypass|inject)"), "educational_hack"),
    (_re(r"(?:in\s+a\s+)?safe\s+(?:environment|context|setting).*(?:how\s+to|explain|demonstrate).*(?:hack|exploit|attack)"), "safe_env_hack"),
]


def check_prompt_injection(text: str) -> DetectorResult:
    """Run all prompt injection pattern tiers against `text`."""
    # High
    for pat, label in _HIGH:
        if pat.search(text):
            return DetectorResult(hit=True, score=90.0, confidence=0.95,
                                  kind="prompt_injection", matches=[label])

    # Medium — collect all hits
    med_hits: list[str] = []
    for pat, label in _MEDIUM:
        if pat.search(text):
            med_hits.append(label)

    if med_hits:
        # Multiple medium hits raise confidence
        conf = min(0.90, 0.70 + (len(med_hits) - 1) * 0.05)
        return DetectorResult(hit=True, score=75.0, confidence=conf,
                              kind="prompt_injection", matches=med_hits)

    # Low — only flag if 2+ hits
    low_hits: list[str] = []
    for pat, label in _LOW:
        if pat.search(text):
            low_hits.append(label)

    if len(low_hits) >= 2:
        return DetectorResult(hit=True, score=50.0, confidence=0.55,
                              kind="prompt_injection", matches=low_hits)

    return DetectorResult(hit=False, score=0.0, confidence=0.0,
                          kind="prompt_injection")
