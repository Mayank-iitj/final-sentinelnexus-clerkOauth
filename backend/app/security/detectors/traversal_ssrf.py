"""
Path Traversal, SSRF, LFI/RFI, XXE, SSTI Detector — 50+ patterns
===================================================================
Covers:
  Path Traversal / LFI:
    - ../  ..\\ encoded variants (%2e%2e, ..%2f, %252e)
    - Sensitive OS file targets (/etc/passwd, /proc/self, win32)
    - PHP wrappers (php://filter, php://input, data://, expect://)
    - Zip/phar wrappers

  RFI (Remote File Inclusion):
    - http:// / https:// in include/require parameters
    - FTP:// and smb:// protocol handlers

  SSRF (Server-Side Request Forgery):
    - Cloud metadata endpoints (AWS, GCP, Azure, DigitalOcean)
    - Internal/private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
    - Localhost variants (localhost, 0.0.0.0, 0177.0.0.1, 0x7f000001)
    - DNS rebinding indicators
    - Alternative protocols (file://, gopher://, dict://, ldap://)
    - Decimal/octal/hex IP representations

  XXE (XML External Entity):
    - ENTITY declaration with SYSTEM/PUBLIC
    - DOCTYPE with external entity
    - XInclude attacks

  SSTI (Server-Side Template Injection):
    - Jinja2 / Twig: {{ }}, {% %}
    - Freemarker: ${}, #{}
    - Pebble / Velocity: ${}
    - Smarty: {php}, {system()}
    - Expression Language (Java EL): #{}, ${pageContext}
    - Mako / ERB
    - Arithmetic probes ({{7*7}}, {{7*'7'}})
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

from app.security.detectors.sqli import DetectorResult


def _re(p: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern[str]:
    return re.compile(p, flags)


# ── Path Traversal / LFI ────────────────────────────────────────────────────
_TRAVERSAL_HIGH: list[tuple[re.Pattern[str], str]] = [
    (_re(r"(?:\.\./|\.\.\\){2,}"),                                     "deep_traversal"),
    (_re(r"%2e%2e(?:%2f|%5c)"),                                        "url_enc_traversal"),
    (_re(r"\.\.%2f|\.\.%5c|%252e%252e"),                               "double_enc_traversal"),
    (_re(r"/etc/(?:passwd|shadow|crontab|sudoers|ssh/(?:id_rsa|authorized_keys))"), "lfi_sensitive"),
    (_re(r"/proc/(?:self|1)/(?:environ|cmdline|mem|fd/)"),             "proc_lfi"),
    (_re(r"\\windows\\(?:system32|win.ini|repair\\sam)"),              "win_lfi"),
    (_re(r"php://(?:filter|input|stdin|fd|memory)"),                   "php_wrapper"),
    (_re(r"data://text/plain(?:;base64)?,[A-Za-z0-9+/=]+"),           "data_wrapper"),
    (_re(r"expect://|zip://|phar://"),                                 "stream_wrapper"),
    (_re(r"\.\.[\\/](?:boot\.ini|win\.ini|system\.ini)"),             "windows_ini"),
]

_TRAVERSAL_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    (_re(r"(?:include|require)(?:_once)?\s*\(\s*(?:https?://|\$_(?:GET|POST|REQUEST))"), "rfi_include"),
    (_re(r"\.\./"),                                                    "single_traversal"),
    (_re(r"/var/(?:log|www|mail|spool)/"),                             "linux_service"),
    (_re(r"C:\\\\(?:Users|Windows|Program\s+Files)"),                 "windows_path"),
    (_re(r"\.git(?:/|\\)(?:config|HEAD|COMMIT_EDITMSG)"),             "git_lfi"),
    (_re(r"\.env|\.htaccess|\.htpasswd|web\.config"),                 "config_lfi"),
]

# ── SSRF ─────────────────────────────────────────────────────────────────────
_SSRF_HIGH: list[tuple[re.Pattern[str], str]] = [
    # Cloud metadata
    (_re(r"169\.254\.169\.254"),                                       "aws_metadata"),
    (_re(r"metadata\.google\.internal|computeMetadata"),              "gcp_metadata"),
    (_re(r"169\.254\.169\.254/metadata"),                             "azure_metadata"),
    (_re(r"instance-data\.ec2\.internal"),                            "ec2_internal"),
    # Private IP ranges
    (_re(r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b"), "private_ip"),
    (_re(r"\b172\.(?:1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}\b"),   "private_ip_172"),
    (_re(r"\b(?:127\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost|loopback)\b"), "loopback"),
    (_re(r"\b0\.0\.0\.0\b"),                                          "any_addr"),
    # Hex/octal/decimal IP obfuscation
    (_re(r"0x7[fF]0{6}1|0177\.0\.0\.1"),                             "hex_loopback"),
    (_re(r"\b2130706433\b"),                                          "int_loopback"),
    # Alternative protocols
    (_re(r"(?:file|gopher|dict|ldap|ldaps|ftp|tftp|sftp|smb|netdoc)://"), "alt_protocol"),
    # Internal service names
    (_re(r"(?:redis|memcached|mongodb|elasticsearch|cassandra)://"),  "internal_service"),
    (_re(r"\b(?:internal|intranet|corp|localhost|local)\b.*://"),     "internal_url"),
]

_SSRF_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    (_re(r"(?:url|uri|endpoint|host|server|callback|redirect|return(?:_?url|_?to)|next|dest(?:ination)?)\s*[=:]\s*https?://"), "ssrf_param"),
    (_re(r"\b(?:webhook|proxy|forward|relay)\s*[=:]\s*https?://"),   "ssrf_service"),
]

# ── XXE ──────────────────────────────────────────────────────────────────────
_XXE_HIGH: list[tuple[re.Pattern[str], str]] = [
    (_re(r"<!DOCTYPE\s+\w+\s+(?:SYSTEM|PUBLIC)\b"),                   "doctype_entity"),
    (_re(r"<!ENTITY\s+\w+\s+(?:SYSTEM|PUBLIC)\b"),                    "entity_decl"),
    (_re(r"<!ENTITY\s+%\s+\w+\s+SYSTEM\b"),                           "param_entity"),
    (_re(r"\bxi:include\b.*\bhref\b"),                                 "xinclude"),
    (_re(r"SYSTEM\s+['\"](?:file|http|ftp|gopher|expect)://"),        "entity_external"),
    (_re(r"SYSTEM\s+['\"]//"),                                        "entity_unc"),
    (_re(r"<!DOCTYPE[^>]+\[<!ENTITY"),                                "doctype_inline"),
]

# ── SSTI ─────────────────────────────────────────────────────────────────────
_SSTI_HIGH: list[tuple[re.Pattern[str], str]] = [
    # Arithmetic probes (classic detection canaries)
    (_re(r"\{\{-?\s*7\s*\*\s*7\s*-?\}\}"),                           "ssti_arith_jinja"),
    (_re(r"\$\{\s*7\s*\*\s*7\s*\}"),                                  "ssti_arith_el"),
    (_re(r"#\{\s*7\s*\*\s*7\s*\}"),                                   "ssti_arith_ruby"),
    (_re(r"\{\{7\*'7'\}\}"),                                           "ssti_arith_twig"),
    # Class/MRO traversal (Python)
    (_re(r"\{\{.*?__class__.*?__mro__"),                              "ssti_mro"),
    (_re(r"\{\{.*?__(?:globals|builtins|import|subclasses)__"),       "ssti_dunder"),
    (_re(r"\{\{.*?(?:request|config|self)\._?(?:dict|class|module)\b"), "ssti_object"),
    # Freemarker
    (_re(r"<#assign.*=\s*\"freemarker"),                              "ssti_freemarker"),
    (_re(r"\$\{\"freemarker"),                                         "ssti_freemarker2"),
    # Smarty
    (_re(r"\{php\}|\{literal\}.*?<\?php"),                            "ssti_smarty"),
    # Java EL
    (_re(r"\$\{pageContext|#\{Runtime\b"),                            "ssti_java_el"),
    # Velocity
    (_re(r"#set\s*\(\s*\$[a-z]+\s*=\s*\$[a-z]+\.(?:exec|evaluate|Runtime)"), "ssti_velocity"),
    # Generic template expression evaluation
    (_re(r"\{\{.*(?:__import__|os\.system|subprocess|eval|exec)\s*\("), "ssti_code_exec"),
    (_re(r"%\{.*(?:Runtime|exec|ProcessBuilder)"),                    "ssti_java_exec"),
]

_SSTI_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    (_re(r"\{\{.*?\}\}"),                                              "jinja_expr"),
    (_re(r"\{%.*?%\}"),                                                "jinja_block"),
    (_re(r"\$\{[^}]{3,}\}"),                                           "el_expr"),
    (_re(r"<%=.*?%>"),                                                 "erb_expr"),
]


def check_traversal_ssrf(text: str) -> DetectorResult:
    """Unified detector for path traversal, SSRF, LFI/RFI, XXE, and SSTI."""
    all_matches: list[str] = []

    # XXE (XML) — check first as it's structurally distinct
    for pat, label in _XXE_HIGH:
        if pat.search(text):
            return DetectorResult(hit=True, score=85.0, confidence=0.93,
                                  kind="xxe", matches=[label])

    # SSTI high
    for pat, label in _SSTI_HIGH:
        if pat.search(text):
            return DetectorResult(hit=True, score=88.0, confidence=0.94,
                                  kind="ssti", matches=[label])

    # SSRF high
    for pat, label in _SSRF_HIGH:
        if pat.search(text):
            all_matches.append(label)
    if all_matches:
        return DetectorResult(hit=True, score=82.0, confidence=0.91,
                              kind="ssrf", matches=all_matches)

    # Path traversal high
    trav_matches: list[str] = []
    for pat, label in _TRAVERSAL_HIGH:
        if pat.search(text):
            trav_matches.append(label)
    if trav_matches:
        return DetectorResult(hit=True, score=80.0, confidence=0.90,
                              kind="path_traversal", matches=trav_matches)

    # SSTI medium
    ssti_med: list[str] = []
    for pat, label in _SSTI_MEDIUM:
        if pat.search(text):
            ssti_med.append(label)
    if len(ssti_med) >= 1:
        return DetectorResult(hit=True, score=65.0, confidence=0.72,
                              kind="ssti", matches=ssti_med)

    # SSRF medium
    ssrf_med: list[str] = []
    for pat, label in _SSRF_MEDIUM:
        if pat.search(text):
            ssrf_med.append(label)
    if ssrf_med:
        return DetectorResult(hit=True, score=60.0, confidence=0.68,
                              kind="ssrf", matches=ssrf_med)

    # Traversal medium
    trav_med: list[str] = []
    for pat, label in _TRAVERSAL_MEDIUM:
        if pat.search(text):
            trav_med.append(label)
    if len(trav_med) >= 2:
        return DetectorResult(hit=True, score=55.0, confidence=0.62,
                              kind="path_traversal", matches=trav_med)

    return DetectorResult(hit=False, score=0.0, confidence=0.0,
                          kind="traversal_ssrf")
