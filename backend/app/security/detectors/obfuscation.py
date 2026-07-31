"""
Obfuscation Detector & Decoder
================================
Multi-layer recursive decoder that unwraps evasion techniques and re-scans.
Detects and decodes:
  - URL encoding (%xx, double-encoded %25xx)
  - Base64 (standard, URL-safe, padded / unpadded)
  - Hex literals (0x..., \\x..., \\u...)
  - HTML entities (&amp;, &#60;, &#x3C;)
  - Unicode homoglyphs (Cyrillic/Greek confusables → Latin)
  - ROT13
  - Leetspeak normalization (4→a, 3→e, 1→i, 0→o, 5→s, 7→t)
  - Null-byte stripping
  - Unicode direction overrides (RLO, LRO marks)
  - Repeated nested encoding detection (score amplifier)

Returns:
  decoded_text: the fully unwrapped string for downstream re-scanning
  DetectorResult: whether obfuscation was actually detected and at what level
"""
from __future__ import annotations

import base64
import html
import math
import re
import unicodedata
import urllib.parse
from dataclasses import dataclass
from typing import Optional

from app.security.detectors.sqli import DetectorResult


# ── Homoglyph map (common Unicode confusables → ASCII) ──────────────────────
_HOMOGLYPHS: dict[str, str] = {
    # Cyrillic → Latin
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O",
    "Р": "P", "С": "C", "Т": "T", "Х": "X",
    # Greek
    "α": "a", "β": "b", "ε": "e", "ο": "o", "ρ": "p", "τ": "t", "υ": "y",
    # Fullwidth ASCII
    **{chr(0xFF01 + i): chr(0x21 + i) for i in range(94)},
    # Mathematical bold/italic/script letters
    **{chr(c): chr(0x61 + (c - 0x1D41A)) for c in range(0x1D41A, 0x1D434)},
    # Unicode direction override characters
    "\u202E": "", "\u202D": "", "\u200B": "", "\u200C": "", "\u200D": "",
    "\uFEFF": "",
}

# ── Leetspeak normalization map ──────────────────────────────────────────────
_LEET: dict[str, str] = {
    "4": "a", "@": "a", "8": "b", "(": "c", "3": "e", "6": "g",
    "1": "i", "!": "i", "|": "i", "0": "o", "9": "g", "$": "s",
    "5": "s", "7": "t", "+": "t", "%": "x", "2": "z",
}

# ROT13 table
_ROT13 = str.maketrans(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm",
)

# Suspicious high-entropy threshold (bits per character)
_ENTROPY_THRESHOLD = 4.5

# Max decode recursion depth
_MAX_DEPTH = 4


def _shannon_entropy(text: str) -> float:
    """Compute Shannon entropy of string in bits per character."""
    if not text:
        return 0.0
    freq: dict[str, int] = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    n = len(text)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


def _normalize_homoglyphs(text: str) -> str:
    result = []
    for ch in text:
        result.append(_HOMOGLYPHS.get(ch, ch))
    return "".join(result)


def _normalize_leet(text: str) -> str:
    """Normalize leetspeak — only inside word-like tokens to avoid false positives."""
    # Only normalize runs of alphanumerics mixed with leet chars
    def replace_leet(m: re.Match) -> str:
        return "".join(_LEET.get(c, c) for c in m.group(0))
    return re.sub(r"[\w@$!|%+]+", replace_leet, text)


def _try_base64(text: str) -> Optional[str]:
    """Try to decode a Base64 string. Returns decoded text or None."""
    # Strip whitespace and try both standard and URL-safe alphabets
    clean = re.sub(r"\s+", "", text)
    for alphabet in (clean, clean + "==", clean + "="):
        for b64 in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                decoded = b64(alphabet)
                result = decoded.decode("utf-8", errors="strict")
                # Only return if decoded string has printable ratio > 70%
                printable = sum(1 for c in result if c.isprintable())
                if printable / max(len(result), 1) > 0.70:
                    return result
            except Exception:
                continue
    return None


def _try_url_decode(text: str) -> str:
    """URL-decode a string (handles double encoding)."""
    try:
        once = urllib.parse.unquote(text)
        twice = urllib.parse.unquote(once)
        return twice if twice != once else once
    except Exception:
        return text


def _try_hex_decode(text: str) -> str:
    """Decode \\xNN and 0xNN hex sequences."""
    def replace_hex(m: re.Match) -> str:
        try:
            return chr(int(m.group(1), 16))
        except ValueError:
            return m.group(0)
    # \xNN or \uNNNN
    text = re.sub(r"\\[xX]([0-9a-fA-F]{2})", replace_hex, text)
    text = re.sub(r"\\[uU]([0-9a-fA-F]{4})", replace_hex, text)
    # 0xNN (standalone hex literals within strings)
    text = re.sub(r"\b0[xX]([0-9a-fA-F]{2})\b", replace_hex, text)
    return text


def _try_html_decode(text: str) -> str:
    """Decode HTML entities."""
    try:
        return html.unescape(text)
    except Exception:
        return text


_B64_PATTERN = re.compile(r"(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?")
_URL_PATTERN = re.compile(r"%[0-9a-fA-F]{2}")
_HEX_PATTERN = re.compile(r"\\[xXuU][0-9a-fA-F]{2,4}")
_HTML_ENTITY = re.compile(r"&(?:#\d+|#x[0-9a-fA-F]+|\w+);")


@dataclass
class ObfuscationResult:
    detected: bool
    score: float
    techniques: list[str]
    decoded_text: str      # fully unwrapped text for re-scanning
    entropy: float


def decode_and_detect(text: str) -> ObfuscationResult:
    """
    Detect and recursively unwrap all obfuscation layers.
    Returns both the detection result and the fully decoded text.
    """
    techniques: list[str] = []
    current = text
    depth = 0

    while depth < _MAX_DEPTH:
        changed = False
        depth += 1

        # URL decode
        decoded_url = _try_url_decode(current)
        if decoded_url != current:
            techniques.append(f"url_encode_d{depth}")
            current = decoded_url
            changed = True

        # HTML entity decode
        decoded_html = _try_html_decode(current)
        if decoded_html != current:
            techniques.append(f"html_entity_d{depth}")
            current = decoded_html
            changed = True

        # Hex decode
        decoded_hex = _try_hex_decode(current)
        if decoded_hex != current:
            techniques.append(f"hex_encode_d{depth}")
            current = decoded_hex
            changed = True

        # Base64 decode — try each b64-looking chunk
        b64_replaced = current
        for m in _B64_PATTERN.finditer(current):
            chunk = m.group(0)
            if len(chunk) >= 16:  # minimum meaningful b64 length
                decoded_b64 = _try_base64(chunk)
                if decoded_b64 and decoded_b64 != chunk:
                    b64_replaced = b64_replaced.replace(chunk, decoded_b64, 1)
                    techniques.append(f"base64_d{depth}")
        if b64_replaced != current:
            current = b64_replaced
            changed = True

        if not changed:
            break

    # Apply character-level normalizations (non-recursive — one pass)
    normalized = _normalize_homoglyphs(current)
    if normalized != current:
        techniques.append("homoglyph")
        current = normalized

    # ROT13 check — if decoding reveals suspicious keywords
    rot13_decoded = current.translate(_ROT13)
    _suspicious = re.compile(r"\b(?:union|select|exec|eval|system|bash|wget|curl|ignore|jailbreak|DAN)\b", re.I)
    if _suspicious.search(rot13_decoded) and not _suspicious.search(current):
        techniques.append("rot13")
        current = rot13_decoded

    # Leet normalization — only if significant number of leet chars found
    leet_ratio = sum(1 for c in current if c in _LEET) / max(len(current), 1)
    if leet_ratio > 0.15:
        leet_normalized = _normalize_leet(current)
        if leet_normalized != current:
            techniques.append("leetspeak")
            current = leet_normalized

    # Entropy analysis on original text
    entropy = _shannon_entropy(text)
    if entropy > _ENTROPY_THRESHOLD and not techniques:
        # High entropy without any identified encoding = suspicious
        techniques.append("high_entropy")

    detected = len(techniques) > 0
    score = 0.0
    if detected:
        # Base obfuscation score
        score = 30.0
        # Each additional layer adds weight
        score += min(40.0, (len(techniques) - 1) * 10.0)
        # High entropy adds more
        if entropy > _ENTROPY_THRESHOLD:
            score += 15.0
        # Nested encoding (depth > 1) is more suspicious
        if any("_d2" in t or "_d3" in t or "_d4" in t for t in techniques):
            score += 20.0

    return ObfuscationResult(
        detected=detected,
        score=min(score, 80.0),
        techniques=techniques,
        decoded_text=current,
        entropy=entropy,
    )


def check_obfuscation(text: str) -> tuple[DetectorResult, str]:
    """
    Main entry point. Returns (DetectorResult, decoded_text).
    The decoded_text should be re-scanned by other detectors.
    """
    result = decode_and_detect(text)
    det = DetectorResult(
        hit=result.detected,
        score=result.score,
        confidence=min(0.95, 0.40 + result.score / 100),
        kind="obfuscation",
        matches=result.techniques,
    )
    return det, result.decoded_text
