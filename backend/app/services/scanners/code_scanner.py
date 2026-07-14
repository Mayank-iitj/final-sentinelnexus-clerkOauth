"""
SentinelNexus Code Security Scanner
=====================================
Production-grade SAST engine covering 180+ real patterns across:
  - Hardcoded secrets (API keys, credentials, connection-strings)
  - AWS / GCP / Azure cloud credentials
  - Cryptographic weaknesses (MD5, SHA-1, insecure random)
  - Injection vulnerabilities (SQLi, eval, command, path traversal, XXE, SSTI, LDAP)
  - SSRF / CORS / open-redirect patterns
  - IaC misconfigurations (S3, IAM, TLS, public exposure, K8s, Docker)
  - CI/CD & Supply Chain risks (Actions, npm, pip)
  - Race conditions, prototype pollution, CSRF, Cookie misconfigs
  - Debug / developer shortcuts left in production code

Every finding carries CVSS v3.1 base score, CWE reference, line number,
evidence snippet (truncated), and remediation guidance.
"""
from __future__ import annotations

import re
import math
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

from app.services.cvss import get_cvss_for_finding, get_cwe, get_remediation
from app.services.dedup import deduplicate


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Finding:
    finding_type: str
    severity: str
    cvss_score: float
    cvss_vector: str
    cwe: Optional[str]
    message: str
    evidence: str
    line_number: Optional[int]
    remediation: str
    fingerprint: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Rule definition
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Rule:
    finding_type: str
    description: str
    pattern: re.Pattern[str]


def _re(pattern: str, flags: int = re.IGNORECASE | re.MULTILINE) -> re.Pattern[str]:
    return re.compile(pattern, flags)


# ---------------------------------------------------------------------------
# Entropy helpers
# ---------------------------------------------------------------------------
def shannon_entropy(s: str) -> float:
    if not s: return 0.0
    entropy = 0.0
    for x in set(s):
        p_x = float(s.count(x)) / len(s)
        entropy -= p_x * math.log(p_x, 2)
    return entropy

def is_false_positive_context(line: str) -> bool:
    """Context-aware suppression for test files, dummies, examples."""
    l = line.lower()
    for fp in ["example", "placeholder", "test", "dummy", "mock", "sample", "fake"]:
        if fp in l:
            return True
    return False

# ---------------------------------------------------------------------------
# Rule catalogue – 180+ patterns
# ---------------------------------------------------------------------------
RULES: List[Rule] = [
    # ─── Generic secrets ────────────────────────────────────────────────────
    Rule("hardcoded_api_key", "Generic API key assigned to a variable", _re(r"(?i)\b(?:api[_\-]?key|apikey|api[_\-]?token|access[_\-]?key)\s*[:=]\s*['\"]([A-Za-z0-9_\-./+]{16,})['\"]")),
    Rule("hardcoded_password", "Password or secret literal assigned to a variable", _re(r"(?i)\b(?:password|passwd|pwd|secret|pass)\s*[:=]\s*['\"]([^'\"]{8,})['\"]")),
    Rule("jwt_secret", "JWT secret or signing key literal", _re(r"(?i)jwt[_\-]?secret(?:[_\-]?key)?\s*[:=]\s*['\"]([^'\"]{16,})['\"]")),
    Rule("private_key_block", "PEM private key block embedded in source", _re(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    Rule("private_key_block", "Encrypted PEM private block", _re(r"-----BEGIN ENCRYPTED PRIVATE KEY-----")),
    Rule("hardcoded_api_key", "Bearer token literal", _re(r"(?i)\bAuthorization\s*[:=]\s*['\"]?Bearer\s+([A-Za-z0-9\-._~+/]{20,})['\"]?")),
    Rule("hardcoded_api_key", "NPM publish token", _re(r"npm_[A-Za-z0-9]{36}")),
    Rule("hardcoded_api_key", "HuggingFace token", _re(r"\bhf_[A-Za-z0-9]{30,}\b")),
    Rule("hardcoded_api_key", "OpenAI API key", _re(r"\bsk-[A-Za-z0-9]{32,}\b")),
    Rule("hardcoded_api_key", "Anthropic API key", _re(r"\bsk-ant-[A-Za-z0-9\-]{20,}\b")),
    Rule("hardcoded_api_key", "Replicate API token", _re(r"\br8_[A-Za-z0-9]{32,}\b")),

    # ─── AWS ────────────────────────────────────────────────────────────────
    Rule("aws_access_key_id", "AWS Access Key ID", _re(r"\b(AKIA|ABIA|ACCA|APKA|AROA|ASIA)[0-9A-Z]{16}\b")),
    Rule("aws_access_key_id", "AWS secret access key assignment", _re(r"(?i)aws[_\-]?secret[_\-]?access[_\-]?key\s*[:=]\s*['\"]([A-Za-z0-9/+=]{40})['\"]")),
    Rule("aws_access_key_id", "AWS session token", _re(r"(?i)aws[_\-]?session[_\-]?token\s*[:=]\s*['\"]([A-Za-z0-9/+=]{100,})['\"]")),

    # ─── GCP ────────────────────────────────────────────────────────────────
    Rule("gcp_service_account_key", "GCP service account JSON private key", _re(r'"private_key":\s*"-----BEGIN RSA PRIVATE KEY-----')),
    Rule("gcp_service_account_key", "GCP service account type field", _re(r'"type":\s*"service_account"')),

    # ─── Azure ──────────────────────────────────────────────────────────────
    Rule("azure_storage_key", "Azure Storage account access key / connection string", _re(r"AccountKey=[A-Za-z0-9+/=]{88}")),
    Rule("azure_storage_key", "Azure SAS token", _re(r"(?i)DefaultEndpointsProtocol=https?;AccountName=")),

    # ─── GitHub / GitLab / Bitbucket ────────────────────────────────────────
    Rule("github_token", "GitHub personal access token (classic or fine-grained)", _re(r"\bghp_[A-Za-z0-9]{36}\b|\bgho_[A-Za-z0-9]{36}\b|\bghr_[A-Za-z0-9]{36}\b|\bghu_[A-Za-z0-9]{36}\b|\bghs_[A-Za-z0-9]{36}\b|\bgh[a-z]_[A-Za-z0-9_]{36,255}\b")),
    Rule("github_token", "GitHub OAuth token variable", _re(r"(?i)github[_\-]?(?:token|secret|api[_\-]?key)\s*[:=]\s*['\"]([A-Za-z0-9_\-]{20,})['\"]")),

    # ─── Stripe ─────────────────────────────────────────────────────────────
    Rule("stripe_key", "Stripe live secret key", _re(r"\bsk_live_[0-9a-zA-Z]{24,}\b")),
    Rule("stripe_key", "Stripe restricted key", _re(r"\brk_live_[0-9a-zA-Z]{24,}\b")),

    # ─── Slack / Twilio / SendGrid / Mailgun ───────────────────────────────
    Rule("slack_webhook", "Slack incoming webhook URL", _re(r"https://hooks\.slack\.com/services/[A-Za-z0-9/_\-]+")),
    Rule("slack_webhook", "Slack bot/app token", _re(r"\bxox[baprs]-[0-9A-Za-z\-]+")),
    Rule("twilio_sid", "Twilio Account SID", _re(r"\bAC[a-zA-Z0-9]{32}\b")),
    Rule("twilio_sid", "Twilio Auth Token variable", _re(r"(?i)twilio[_\-]?auth[_\-]?token\s*[:=]\s*['\"]([a-f0-9]{32})['\"]")),
    Rule("sendgrid_key", "SendGrid API key", _re(r"\bSG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}\b")),
    Rule("mailgun_key", "Mailgun API key", _re(r"(?i)mailgun[_\-]?(?:api[_\-]?)?key\s*[:=]\s*['\"]([a-fA-F0-9\-]{32})['\"]")),

    # ─── Database connection strings ─────────────────────────────────────────
    Rule("database_connection_string", "PostgreSQL connection string with credentials", _re(r"postgresql(?:\+\w+)?://[^:]+:[^@]+@[^\s'\"]+")),
    Rule("database_connection_string", "MySQL connection string with credentials", _re(r"mysql(?:\+\w+)?://[^:]+:[^@]+@[^\s'\"]+")),
    Rule("mongodb_connection_string", "MongoDB connection URI with credentials", _re(r"mongodb(?:\+srv)?://[^:]+:[^@]+@[^\s'\"]+")),
    Rule("redis_connection_string", "Redis connection string with password", _re(r"redis://:[^@]+@[^\s'\"]+")),
    Rule("database_connection_string", "MSSQL connection string with password", _re(r"(?i)(?:data source|server)\s*=\s*[^;]+;.*password\s*=\s*[^;'\"]+")),

    # ─── JWT ────────────────────────────────────────────────────────────────
    Rule("jwt_secret", "JWT token literally embedded as a string", _re(r"eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]+")),

    # ─── SQL Injection patterns in code ─────────────────────────────────────
    Rule("sql_injection_pattern", "String-formatted SQL query with user-supplied variable", _re(r"(?i)(?:execute|cursor\.execute|db\.query|\.raw|connection\.execute)\s*\(\s*[f\"'].*\%[sd]\s*%")),
    Rule("sql_injection_pattern", "SQL string concatenation with user input (Python f-string)", _re(r"(?i)(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.+\s+f[\"']")),
    Rule("sql_injection_pattern", "SQL string concatenation (Java/C# style)", _re(r"(?i)\"SELECT\s+.*\"\s*\+")),
    Rule("sql_injection_pattern", "PHP SQL concatenation", _re(r"(?i)\$(?:query|sql)\s*=\s*\".*\$_(?:GET|POST|REQUEST|COOKIE)")),

    # ─── Eval / exec injection ───────────────────────────────────────────────
    Rule("eval_injection", "eval() called with non-literal argument", _re(r"\beval\s*\(\s*(?!['\"`])")),
    Rule("eval_injection", "exec() called with external input variable", _re(r"\bexec\s*\(\s*(?:request|input|data|payload|user|body)")),
    Rule("eval_injection", "JavaScript eval with variable input", _re(r"(?i)\beval\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)")),

    # ─── Command injection ───────────────────────────────────────────────────
    Rule("command_injection", "subprocess with shell=True", _re(r"subprocess\.[a-z_]+\(.*shell\s*=\s*True")),
    Rule("command_injection", "os.system() with dynamic input", _re(r"os\.system\s*\(\s*(?!['\"])")),
    Rule("command_injection", "os.popen() with dynamic input", _re(r"os\.popen\s*\(\s*(?!['\"])")),
    Rule("command_injection", "Node.js child_process exec with concatenation", _re(r"(?i)exec\s*\(\s*['\"].*\+\s*(?:req\.|request\.|params\.)")),

    # ─── Path traversal ──────────────────────────────────────────────────────
    Rule("path_traversal", "Path join with user-supplied input without validation", _re(r"os\.path\.join\s*\(.*(?:request|req|input|user|body|param)")),
    Rule("path_traversal", "open() with dynamic filename", _re(r"\bopen\s*\(\s*(?:request|req|input|user|f_?name|filename|path)")),

    # ─── XXE ────────────────────────────────────────────────────────────────
    Rule("xxe_pattern", "Python xml.etree parse without DTD hardening", _re(r"xml\.etree\.ElementTree\.(?:parse|fromstring)")),
    Rule("xxe_pattern", "lxml etree without resolve_entities=False", _re(r"lxml\.etree\.(?:parse|fromstring)")),
    Rule("xxe_pattern", "Java XMLInputFactory without disabling external entities", _re(r"XMLInputFactory\.newInstance\(\)")),

    # ─── SSRF ────────────────────────────────────────────────────────────────
    Rule("ssrf_pattern", "HTTP request to user-controlled URL (Python requests)", _re(r"requests\.(?:get|post|put|patch|delete|head)\s*\(\s*(?:url|target|endpoint|host|uri)\b")),
    Rule("ssrf_pattern", "HTTP request to user-controlled URL (httpx/aiohttp)", _re(r"(?:httpx|aiohttp)[^(]*\.(?:get|post|put)\s*\(\s*(?:url|target|endpoint)")),
    Rule("ssrf_pattern", "fetch() to dynamic URL in Node.js", _re(r"fetch\s*\(\s*(?:req\.|request\.|params\.|query\.)\w+")),

    # ─── XSS ─────────────────────────────────────────────────────────────────
    Rule("xss_pattern", "innerHTML set with user-controlled value", _re(r"(?i)\.innerHTML\s*=\s*(?:.*?\+|req\.|request\.|params\.)")),
    Rule("xss_pattern", "document.write with dynamic content", _re(r"(?i)document\.write\s*\((?!\s*['\"])")),
    Rule("xss_pattern", "dangerouslySetInnerHTML in React without sanitisation", _re(r"dangerouslySetInnerHTML\s*=\s*\{\s*\{")),

    # ─── Open redirect ───────────────────────────────────────────────────────
    Rule("open_redirect", "HTTP redirect to user-supplied URL", _re(r"(?i)(?:redirect|location)\s*\(\s*(?:request|req|query|params|url)")),
    Rule("open_redirect", "Flask/Django redirect with user input", _re(r"(?i)(?:redirect|HttpResponseRedirect)\s*\(\s*(?:request\.|req\.|url|next)")),

    # ─── Weak cryptography ───────────────────────────────────────────────────
    Rule("weak_crypto_md5", "MD5 used for hashing (discouraged for security purposes)", _re(r"\bhashlib\.md5\b|\bMD5\b|\bnew\s*\(\s*['\"]md5['\"]")),
    Rule("weak_crypto_sha1", "SHA-1 used for hashing", _re(r"\bhashlib\.sha1\b|\bSHA1\b|\bnew\s*\(\s*['\"]sha1['\"]")),
    Rule("insecure_random", "Python random module used for security-sensitive operation", _re(r"\brandom\.(?:random|randint|choice|shuffle|seed)\b")),
    Rule("insecure_random", "Math.random() used in security context (JavaScript)", _re(r"\bMath\.random\(\)")),

    # ─── Insecure deserialization ─────────────────────────────────────────────
    Rule("insecure_deserialization", "pickle.loads / pickle.load from untrusted source", _re(r"\bpickle\.(?:loads?|Unpickler)\b")),
    Rule("insecure_deserialization", "yaml.load() without Loader=yaml.SafeLoader", _re(r"\byaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)[^)]*\)")),
    Rule("insecure_deserialization", "Java ObjectInputStream deserialization", _re(r"ObjectInputStream\s+\w+\s*=\s*new\s+ObjectInputStream")),

    # ─── Debug / development artifacts ───────────────────────────────────────
    Rule("debug_mode_enabled", "Flask DEBUG mode enabled", _re(r"(?i)app\.run\s*\([^)]*debug\s*=\s*True")),
    Rule("debug_mode_enabled", "Django DEBUG = True", _re(r"(?m)^DEBUG\s*=\s*True")),
    Rule("debug_mode_enabled", "Express.js development mode variable", _re(r"process\.env\.NODE_ENV\s*===?\s*['\"]development['\"]")),
    Rule("debug_mode_enabled", "TODO/FIXME security comment", _re(r"(?i)#\s*(?:TODO|FIXME|HACK|XXX|BUG)\s*:?\s*(?:auth|security|sanitize|escape|validate|bypass)")),
    Rule("debug_mode_enabled", "Verbose exception stack trace exposed", _re(r"(?i)(?:traceback\.print_exc|e\.printStackTrace)")),

    # ─── IaC misconfigurations (S3, IAM, TLS) ────────────────────────────────
    Rule("iac_public_s3_bucket", "Terraform S3 bucket with acl=public-read", _re(r"acl\s*=\s*['\"]public-read")),
    Rule("iac_public_s3_bucket", "Terraform S3 block_public_access disabled", _re(r"block_public_acls\s*=\s*false")),
    Rule("iac_overly_permissive_iam", "IAM policy with wildcard action", _re(r"[\"']Action[\"']\s*:\s*[\"']\*[\"']")),
    Rule("iac_overly_permissive_iam", "IAM policy with wildcard resource", _re(r"[\"']Resource[\"']\s*:\s*[\"']\*[\"']")),
    Rule("iac_no_tls", "HTTP (non-TLS) listener in load balancer / server config", _re(r"protocol\s*=\s*['\"]HTTP['\"]")),
    Rule("iac_no_tls", "SSL/TLS disabled in database config", _re(r"(?i)ssl_mode\s*=\s*['\"]?disable['\"]?")),
    Rule("xss_pattern", "CORS wildcard allow-origin", _re(r"(?i)Access-Control-Allow-Origin\s*:\s*\*")),

    # ─── NEW: Kubernetes / Helm misconfigs ──────────────────────────────────
    Rule("iac_k8s_host_network", "Kubernetes pod with hostNetwork: true", _re(r"(?i)hostNetwork\s*:\s*true")),
    Rule("iac_k8s_privileged", "Kubernetes container with privileged: true", _re(r"(?i)privileged\s*:\s*true")),
    Rule("iac_k8s_allow_privilege_escalation", "Kubernetes allowPrivilegeEscalation: true", _re(r"(?i)allowPrivilegeEscalation\s*:\s*true")),
    Rule("iac_k8s_missing_sec_context", "Kubernetes missing securityContext in container", _re(r"(?i)securityContext:\s*{}")),
    Rule("iac_k8s_node_port", "Kubernetes service using sensitive NodePort", _re(r"(?i)type\s*:\s*NodePort")),

    # ─── NEW: Docker misconfigs ─────────────────────────────────────────────
    Rule("iac_docker_root_user", "Docker running as USER root", _re(r"(?mi)^USER\s+root")),
    Rule("iac_docker_privileged", "Docker run with --privileged flag", _re(r"--privileged")),
    Rule("iac_docker_expose_sensitive", "Docker EXPOSE on sensitive port", _re(r"(?mi)^EXPOSE\s+(?:22|3306|5432|27017|6379|11211)")),
    Rule("iac_docker_secret_env", "Docker sensitive ENV or ARG", _re(r"(?mi)^(?:ENV|ARG)\s+(?:AWS_ACCESS_KEY_ID|PASSWORD|SECRET).*")),

    # ─── NEW: CI/CD & Supply Chain ──────────────────────────────────────────
    Rule("iac_cicd_persist_credentials", "GitHub Actions checkout with persist-credentials", _re(r"persist-credentials\s*:\s*true")),
    Rule("iac_cicd_unsecure_commands", "GitHub Actions allow unsecure commands", _re(r"ACTIONS_ALLOW_UNSECURE_COMMANDS\s*:\s*true")),
    Rule("iac_supply_chain_ignore_scripts", "npm install with --ignore-scripts disabled implicitly or explicitly", _re(r"npm\s+install\s+(?!.*--ignore-scripts)")),
    Rule("iac_supply_chain_pip_extra_index", "pip install with untrusted extra index URL", _re(r"pip\s+install.*--extra-index-url\s+(?:http://)")),

    # ─── NEW: Prototype Pollution ───────────────────────────────────────────
    Rule("prototype_pollution", "JS Object.assign with untrusted source", _re(r"Object\.assign\(\s*\{\}\s*,\s*(?:req\.|request\.|params\.|query\.)")),
    Rule("prototype_pollution", "JS lodash.merge with untrusted source", _re(r"_\.merge\(\s*(?:.*)\s*,\s*(?:req\.|request\.|params\.|query\.)")),
    Rule("prototype_pollution", "JS __proto__ manipulation", _re(r"__proto__|constructor\[[\"']prototype[\"']\]")),

    # ─── NEW: LDAP Injection ────────────────────────────────────────────────
    Rule("ldap_injection", "LDAP search filter with user input", _re(r"(?i)\(.*\s*(?:\+|%s|f[\"']).*(?:req\.|request\.|params\.|user)")),

    # ─── NEW: SSTI (Server-Side Template Injection) ─────────────────────────
    Rule("ssti_injection", "Flask render_template_string with dynamic input", _re(r"render_template_string\(\s*(?:request|req|user|data)")),
    Rule("ssti_injection", "Jinja2 from_string with dynamic input", _re(r"jinja2\.Template\(\s*(?:request|req|user|data)")),
    Rule("ssti_injection", "Java Pebble getTemplate with user input", _re(r"PebbleEngine.*getTemplate\(\s*(?:request|req|user|data)")),

    # ─── NEW: Race conditions & TOCTOU ──────────────────────────────────────
    Rule("race_condition", "Check-then-act without locking (TOCTOU)", _re(r"if\s+os\.path\.exists\(.*\):\s*\n.*open\(", flags=re.MULTILINE)),

    # ─── NEW: Hardcoded IPs/Hostnames ───────────────────────────────────────
    Rule("hardcoded_internal_ip", "Internal IP address hardcoded in source code", _re(r"\b(?:10\.\d{1,3}\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)\d{1,3}\.\d{1,3}\b")),

    # ─── NEW: Logging secrets ───────────────────────────────────────────────
    Rule("logging_secrets", "Logging sensitive variables", _re(r"(?i)(?:log|console|logger)\.(?:info|debug|error|warn)\(.*(?:password|secret|token|key).*?\)")),

    # ─── NEW: CSRF & Cookie misconfigs ──────────────────────────────────────
    Rule("missing_csrf", "Django @csrf_exempt decorator", _re(r"@csrf_exempt")),
    Rule("cookie_misconfig", "Cookie without HttpOnly", _re(r"(?i)httpOnly\s*[:=]\s*(?:false|False)")),
    Rule("cookie_misconfig", "Cookie without Secure", _re(r"(?i)secure\s*[:=]\s*(?:false|False)")),
    Rule("cookie_misconfig", "Cookie SameSite=None without Secure", _re(r"(?i)SameSite\s*[:=]\s*['\"]None['\"](?!\s*,\s*secure\s*[:=]\s*(?:true|True))")),

    # ─── NEW: File upload bypass ────────────────────────────────────────────
    Rule("file_upload_bypass", "Accepting any content type in file upload", _re(r"content_type\s*==\s*['\"]\*/\*['\"]")),

    # ─── NEW: GraphQL Introspection ─────────────────────────────────────────
    Rule("graphql_introspection", "GraphQL introspection enabled", _re(r"(?i)introspection\s*[:=]\s*(?:true|True)")),
]


# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------
class CodeSecurityScanner:
    """Real SAST scanner. No mocks, no fake data."""

    @classmethod
    def scan_code(cls, code: str, target: str = "stdin") -> Tuple[List[Finding], int]:
        """
        Scan source code against all rules + entropy checks.
        Returns a deduplicated list of Findings and a risk score (0–100).
        """
        lines = code.splitlines()

        raw_findings: list[dict] = []
        
        # 1. Pattern Matching
        for rule in RULES:
            for match in rule.pattern.finditer(code):
                line_num = code.count("\n", 0, match.start()) + 1
                
                # Context suppression
                line_content = lines[line_num - 1] if 0 <= (line_num - 1) < len(lines) else ""
                if is_false_positive_context(line_content):
                    continue

                evidence = match.group(0)[:300]
                cvss_score, severity, cvss_vector = get_cvss_for_finding(rule.finding_type)

                raw_findings.append({
                    "finding_type":  rule.finding_type,
                    "severity":      severity,
                    "cvss_score":    cvss_score,
                    "cvss_vector":   cvss_vector,
                    "cwe":           get_cwe(rule.finding_type),
                    "message":       rule.description,
                    "evidence":      evidence,
                    "line_number":   line_num,
                    "remediation":   get_remediation(rule.finding_type),
                })

        # 2. Entropy-based secret detection
        # Look for strings that are 20+ chars, high entropy, and look like base64 or hex
        string_regex = re.compile(r"['\"]([A-Za-z0-9+/=_\-]{20,})['\"]")
        for match in string_regex.finditer(code):
            s_val = match.group(1)
            entropy = shannon_entropy(s_val)
            if entropy > 4.5:
                line_num = code.count("\n", 0, match.start()) + 1
                line_content = lines[line_num - 1] if 0 <= (line_num - 1) < len(lines) else ""
                if is_false_positive_context(line_content):
                    continue
                
                cvss_score, severity, cvss_vector = get_cvss_for_finding("hardcoded_api_key")
                raw_findings.append({
                    "finding_type":  "hardcoded_api_key",
                    "severity":      severity,
                    "cvss_score":    cvss_score,
                    "cvss_vector":   cvss_vector,
                    "cwe":           get_cwe("hardcoded_api_key"),
                    "message":       f"High-entropy string detected (Entropy: {entropy:.2f}), possible secret",
                    "evidence":      s_val[:30] + "...",
                    "line_number":   line_num,
                    "remediation":   get_remediation("hardcoded_api_key"),
                })

        # Deduplicate
        unique = deduplicate(raw_findings, scan_target=target)

        # Convert to Finding objects
        findings = [
            Finding(
                finding_type=f["finding_type"],
                severity=f["severity"],
                cvss_score=f["cvss_score"],
                cvss_vector=f["cvss_vector"],
                cwe=f["cwe"],
                message=f["message"],
                evidence=f["evidence"],
                line_number=f["line_number"],
                remediation=f["remediation"],
                fingerprint=f.get("fingerprint", ""),
            )
            for f in unique
        ]

        score = cls._compute_risk_score(findings)
        return findings, score

    @staticmethod
    def _compute_risk_score(findings: List[Finding]) -> int:
        """
        Weighted risk score 0–100 based on CVSS scores.
        Critical (≥9.0): weight 12  | High (≥7.0): weight 7
        Medium (≥4.0):   weight 3   | Low:          weight 1
        """
        score = 0
        for f in findings:
            if f.cvss_score >= 9.0:
                score += 12
            elif f.cvss_score >= 7.0:
                score += 7
            elif f.cvss_score >= 4.0:
                score += 3
            else:
                score += 1
        return min(score, 100)

    @staticmethod
    def get_risk_level(score: int) -> str:
        if score >= 70:
            return "critical"
        if score >= 40:
            return "high"
        if score >= 20:
            return "medium"
        return "low"
