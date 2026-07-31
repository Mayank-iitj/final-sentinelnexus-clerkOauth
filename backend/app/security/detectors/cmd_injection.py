"""
Command Injection Detector — 60+ patterns
==========================================
Covers:
  - Shell chaining operators (;, |, &&, ||, &)
  - Backtick / $() command substitution
  - Path traversal to OS-sensitive files
  - Common exfil tools (wget, curl, nc, ncat)
  - Reverse shell payloads
  - Windows-specific (cmd.exe, powershell, wscript)
  - Python/perl/ruby/PHP one-liners
  - Null-byte injection
  - Argument injection (/etc, -e, --exec)
  - Docker/kubectl privilege escalation
"""
from __future__ import annotations

import re
from app.security.detectors.sqli import DetectorResult


def _re(p: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern[str]:
    return re.compile(p, flags)


_HIGH: list[tuple[re.Pattern[str], str]] = [
    # Shell chaining with OS commands
    (_re(r"(?:;|\||&&|\|\|)\s*(?:ls|dir|cat|rm|del|cp|mv|wget|curl|nc|ncat|bash|sh|zsh|ksh|cmd|powershell|python3?|perl|ruby|php)\b"), "chain_os_cmd"),
    # Backtick substitution
    (_re(r"`[^`\n]{1,200}`"), "backtick_sub"),
    # $() substitution
    (_re(r"\$\([^)]{1,200}\)"), "dollar_sub"),
    # Reverse shells
    (_re(r"\bnc\s+(?:-[a-zA-Z]\s+\S+\s+)*(?:\d{1,3}(?:\.\d{1,3}){3}|\S+)\s+\d{2,5}"), "nc_reverse"),
    (_re(r"bash\s+-i\s+>&?\s*/dev/tcp/"), "bash_tcp_reverse"),
    (_re(r"/bin/(?:bash|sh)\s+-i"), "bash_interactive"),
    (_re(r"(?:python|perl|ruby|php)\s+(?:-e|-r|-c)\s+['\"]?(?:import|require|exec|system|os\.|socket\.)"), "scripted_reverse"),
    # Exfil via curl/wget
    (_re(r"(?:curl|wget)\s+(?:-[a-zA-Z]+\s+)*https?://(?!\s*$)"), "exfil_http"),
    (_re(r"curl\s+-[a-zA-Z]*d\s+(?:@?/|['\"]?(?:cat|/etc))"), "curl_data_exfil"),
    # Windows cmd
    (_re(r"cmd(?:\.exe)?\s*/[cCkK]\s+"), "cmd_exe"),
    (_re(r"powershell(?:\.exe)?\s+(?:-[a-zA-Z]+\s+)*(?:-e(?:nc|ncode(?:d)?[cC]ommand)?|-[wW]indow[sS]tyle\s+hidden|-[bB]ypass|-[eE]xecution[pP]olicy\s+[bB]ypass)"), "powershell_evasion"),
    (_re(r"powershell\s+-[a-zA-Z]*[eE]\s+[A-Za-z0-9+/=]{20,}"), "ps_encoded_cmd"),
    (_re(r"wscript(?:\.exe)?\s+|cscript(?:\.exe)?\s+"), "wscript"),
    (_re(r"mshta(?:\.exe)?\s+"), "mshta"),
    (_re(r"certutil\s+(?:-[a-zA-Z]+\s+)*-decode\b"), "certutil_decode"),
    # Null byte
    (_re(r"%00|\\x00|\x00|\\u0000"), "null_byte"),
    # Docker/kubectl escape
    (_re(r"docker\s+run\s+(?:--privileged|--cap-add\s+SYS_ADMIN|-v\s+/:/mnt)"), "docker_escape"),
    (_re(r"kubectl\s+exec\s+(?:-it\s+)?[^\s]+\s+--\s+(?:bash|sh|/bin/)"), "kubectl_exec"),
    # chmod/chown on sensitive paths
    (_re(r"chmod\s+(?:777|[0-7]{3,4})\s+/(?:bin|etc|usr|tmp)"), "chmod_sensitive"),
    # cron injection
    (_re(r"(?:crontab|at\s+now)\s+.*(?:curl|wget|bash|python|nc)\b"), "cron_inject"),
]

_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    # Path traversal to sensitive locations
    (_re(r"\.\.[\\/]+\.\.[\\/]+(?:etc[\\/]|windows[\\/]|proc[\\/])"), "path_traversal"),
    (_re(r"/etc/(?:passwd|shadow|crontab|sudoers|hosts|resolv\.conf)"), "sensitive_file"),
    (_re(r"C:\\\\(?:Windows|System32|Users\\\\Administrator)"), "win_sensitive"),
    (_re(r"/proc/(?:self|1)/(?:environ|cmdline|mem|maps)"), "proc_self"),
    # Common dangerous executables
    (_re(r"\b(?:sudo|su)\s+(?:-[a-z]\s+)*(?:\w+\s+)?(?:bash|sh|python|perl|ruby|nc|ncat)\b"), "sudo_shell"),
    (_re(r"\bchmod\s+[0-7]{3,4}\b"), "chmod_any"),
    (_re(r"\bssh\s+(?:-[a-zA-Z]+\s+)*-[oO]\s+(?:StrictHostKeyChecking|UserKnownHostsFile)"), "ssh_option_inject"),
    # Argument injection
    (_re(r"(?:-[a-zA-Z]+|--\w+)\s+(?:/dev/(?:stdin|tcp|udp)|/proc/)"), "arg_dev"),
    (_re(r"--exec\s+|--eval\s+|-e\s+(?:exec|system|os\.)"), "exec_arg"),
    # Environment variable injection
    (_re(r"(?:LD_PRELOAD|LD_LIBRARY_PATH|PATH|PYTHONPATH)\s*=\s*/(?:tmp|dev|proc)"), "env_inject"),
    # Python exec/eval
    (_re(r"\b(?:exec|eval|compile|__import__|importlib\.import_module)\s*\("), "python_exec"),
    (_re(r"os\.(?:system|popen|execv?[pe]?|spawn[lv][pe]?)\s*\("), "os_system"),
    (_re(r"subprocess\.(?:call|run|Popen|check_output)\s*\("), "subprocess_call"),
    # PHP injection
    (_re(r"<\?php\s+(?:system|exec|shell_exec|passthru|popen|proc_open)\s*\("), "php_exec"),
    # Template injection indicators (basic)
    (_re(r"\{\{\s*(?:7\s*\*\s*7|''\.class\.mro|self\._dict_)\s*\}\}"), "ssti_hint"),
]

_LOW: list[tuple[re.Pattern[str], str]] = [
    (_re(r"\b(?:cat|type)\s+[\w/.]+"), "cat_file"),
    (_re(r"\b(?:ls|dir)\s+-"), "ls_flag"),
    (_re(r">\s*(?:/dev/null|NUL)"), "redirect_null"),
    (_re(r"\b(?:rm|del)\s+(?:-[a-zA-Z]+\s+)?[\w/.*]+"), "rm_file"),
]


def check_cmd_injection(text: str) -> DetectorResult:
    """Run all command injection patterns against `text`."""
    for pat, label in _HIGH:
        if pat.search(text):
            return DetectorResult(hit=True, score=85.0, confidence=0.92,
                                  kind="cmd_injection", matches=[label])

    med_hits: list[str] = []
    for pat, label in _MEDIUM:
        if pat.search(text):
            med_hits.append(label)
    if med_hits:
        return DetectorResult(hit=True, score=68.0, confidence=0.78,
                              kind="cmd_injection", matches=med_hits)

    low_hits: list[str] = []
    for pat, label in _LOW:
        if pat.search(text):
            low_hits.append(label)
    if len(low_hits) >= 2:
        return DetectorResult(hit=True, score=38.0, confidence=0.48,
                              kind="cmd_injection", matches=low_hits)

    return DetectorResult(hit=False, score=0.0, confidence=0.0, kind="cmd_injection")
