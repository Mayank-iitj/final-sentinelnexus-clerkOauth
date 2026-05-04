"""
CVSS v3.1 Base Score Calculator
================================
Implements the full CVSS v3.1 specification vectors and numeric scoring.
Reference: https://www.first.org/cvss/specification-document
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# CVSS v3.1 Metric Tables
# ---------------------------------------------------------------------------
_AV = {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.2}   # Attack Vector
_AC = {"L": 0.77, "H": 0.44}                            # Attack Complexity
_PR_U = {"N": 0.85, "L": 0.62, "H": 0.27}              # Privileges Required (Unchanged)
_PR_C = {"N": 0.85, "L": 0.68, "H": 0.50}              # Privileges Required (Changed)
_UI = {"N": 0.85, "R": 0.62}                            # User Interaction
_S = {"U", "C"}                                          # Scope
_CIA = {"N": 0.00, "L": 0.22, "H": 0.56}               # Confidentiality / Integrity / Availability


@dataclass(frozen=True)
class CVSSVector:
    """Structured representation of a CVSS v3.1 Base vector."""
    AV: str  # N(etwork), A(djacent), L(ocal), P(hysical)
    AC: str  # L(ow), H(igh)
    PR: str  # N(one), L(ow), H(igh)
    UI: str  # N(one), R(equired)
    S: str   # U(nchanged), C(hanged)
    C: str   # N(one), L(ow), H(igh)
    I: str   # N(one), L(ow), H(igh)
    A: str   # N(one), L(ow), H(igh)

    @classmethod
    def from_string(cls, vector: str) -> "CVSSVector":
        """Parse CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H -> CVSSVector"""
        vector = vector.replace("CVSS:3.1/", "").replace("CVSS:3.0/", "")
        parts: dict[str, str] = {}
        for segment in vector.split("/"):
            if ":" in segment:
                k, v = segment.split(":", 1)
                parts[k] = v
        return cls(
            AV=parts.get("AV", "N"),
            AC=parts.get("AC", "L"),
            PR=parts.get("PR", "N"),
            UI=parts.get("UI", "N"),
            S=parts.get("S", "U"),
            C=parts.get("C", "N"),
            I=parts.get("I", "N"),
            A=parts.get("A", "N"),
        )

    def to_string(self) -> str:
        return f"CVSS:3.1/AV:{self.AV}/AC:{self.AC}/PR:{self.PR}/UI:{self.UI}/S:{self.S}/C:{self.C}/I:{self.I}/A:{self.A}"


def _roundup(x: float) -> float:
    """CVSS v3.1 specification round-up to one decimal place."""
    int_x = int(x * 100_000)
    if int_x % 10_000 == 0:
        return int_x / 100_000
    return (math.floor(int_x / 10_000) + 1) / 10


def calculate_base_score(vector: CVSSVector) -> float:
    """Return CVSS v3.1 base score (0.0 – 10.0)."""
    av = _AV.get(vector.AV, 0.85)
    ac = _AC.get(vector.AC, 0.77)
    pr = (_PR_C if vector.S == "C" else _PR_U).get(vector.PR, 0.85)
    ui = _UI.get(vector.UI, 0.85)
    c  = _CIA.get(vector.C, 0.0)
    i  = _CIA.get(vector.I, 0.0)
    a  = _CIA.get(vector.A, 0.0)

    iss = 1 - (1 - c) * (1 - i) * (1 - a)

    if vector.S == "U":
        impact = 6.42 * iss
    else:
        impact = 7.52 * (iss - 0.029) - 3.25 * ((iss - 0.02) ** 15)

    exploitability = 8.22 * av * ac * pr * ui

    if impact <= 0:
        return 0.0

    if vector.S == "U":
        base = min(impact + exploitability, 10)
    else:
        base = min(1.08 * (impact + exploitability), 10)

    return _roundup(base)


def score_to_severity(score: float) -> str:
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score >= 0.1:
        return "low"
    return "none"


def score_from_vector_string(vector_str: str) -> tuple[float, str]:
    """Convenience wrapper: parse vector string → (score, severity)."""
    vec = CVSSVector.from_string(vector_str)
    score = calculate_base_score(vec)
    return score, score_to_severity(score)


# ---------------------------------------------------------------------------
# Pre-defined vectors for common finding types
# ---------------------------------------------------------------------------
FINDING_VECTORS: dict[str, str] = {
    # Secrets
    "hardcoded_api_key":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N",
    "hardcoded_password":         "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    "private_key_block":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
    "aws_access_key_id":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "gcp_service_account_key":    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "azure_storage_key":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "slack_webhook":              "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
    "github_token":               "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:L",
    "jwt_secret":                 "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    "stripe_key":                 "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
    "sendgrid_key":               "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
    "twilio_sid":                 "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
    "mailgun_key":                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
    "database_connection_string": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    "mongodb_connection_string":  "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    "redis_connection_string":    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:M/A:M",
    # Code weaknesses
    "sql_injection_pattern":      "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
    "eval_injection":             "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "command_injection":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "path_traversal":             "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N",
    "xxe_pattern":                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:L",
    "ssrf_pattern":               "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:L/A:N",
    "xss_pattern":                "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    "weak_crypto_md5":            "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N",
    "weak_crypto_sha1":           "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
    "insecure_random":            "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N",
    "debug_mode_enabled":         "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    "insecure_deserialization":   "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    "open_redirect":              "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
    # PII
    "credit_card_number":         "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    "social_security_number":     "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    "email_address":              "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N",
    "phone_number":               "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N",
    "iban_number":                "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    "passport_number":            "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    # Prompt injection
    "prompt_injection":           "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:L",
    "jailbreak_attempt":          "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:L",
    "pii_exfiltration_attempt":   "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N",
    "system_prompt_leakage":      "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N",
    # IaC
    "iac_public_s3_bucket":       "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N",
    "iac_overly_permissive_iam":  "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:L",
    "iac_no_tls":                 "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:L/A:N",
}

# CWE mappings for findings
FINDING_CWE: dict[str, str] = {
    "hardcoded_api_key":          "CWE-798",
    "hardcoded_password":         "CWE-259",
    "private_key_block":          "CWE-321",
    "aws_access_key_id":          "CWE-798",
    "gcp_service_account_key":    "CWE-798",
    "azure_storage_key":          "CWE-798",
    "slack_webhook":              "CWE-798",
    "github_token":               "CWE-798",
    "jwt_secret":                 "CWE-321",
    "stripe_key":                 "CWE-798",
    "database_connection_string": "CWE-312",
    "mongodb_connection_string":  "CWE-312",
    "redis_connection_string":    "CWE-312",
    "sql_injection_pattern":      "CWE-89",
    "eval_injection":             "CWE-95",
    "command_injection":          "CWE-77",
    "path_traversal":             "CWE-22",
    "xxe_pattern":                "CWE-611",
    "ssrf_pattern":               "CWE-918",
    "xss_pattern":                "CWE-79",
    "weak_crypto_md5":            "CWE-328",
    "weak_crypto_sha1":           "CWE-328",
    "insecure_random":            "CWE-338",
    "debug_mode_enabled":         "CWE-489",
    "insecure_deserialization":   "CWE-502",
    "open_redirect":              "CWE-601",
    "credit_card_number":         "CWE-312",
    "social_security_number":     "CWE-312",
    "email_address":              "CWE-359",
    "phone_number":               "CWE-359",
    "iban_number":                "CWE-312",
    "passport_number":            "CWE-312",
    "prompt_injection":           "CWE-74",
    "jailbreak_attempt":          "CWE-20",
    "pii_exfiltration_attempt":   "CWE-200",
    "system_prompt_leakage":      "CWE-200",
    "iac_public_s3_bucket":       "CWE-732",
    "iac_overly_permissive_iam":  "CWE-732",
    "iac_no_tls":                 "CWE-311",
}

# Remediation one-liners
FINDING_REMEDIATION: dict[str, str] = {
    "hardcoded_api_key":          "Move to environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault).",
    "hardcoded_password":         "Remove from source; rotate credential immediately; use a secrets manager.",
    "private_key_block":          "Remove from repository immediately; rotate the key pair; use secrets management.",
    "aws_access_key_id":          "Rotate AWS key immediately; use IAM roles instead of long-lived keys.",
    "gcp_service_account_key":    "Revoke and recreate service account key; use Workload Identity Federation.",
    "azure_storage_key":          "Regenerate Azure Storage key; use Managed Identity authentication.",
    "slack_webhook":              "Rotate the Slack webhook URL; restrict webhook permissions.",
    "github_token":               "Revoke the GitHub PAT immediately; use short-lived GitHub Actions OIDC tokens.",
    "jwt_secret":                 "Rotate the JWT secret; use asymmetric RS256/ES256 keys.",
    "stripe_key":                 "Rotate the Stripe key; use restricted keys with minimal permissions.",
    "database_connection_string": "Move to environment variable / secrets manager; use least-privilege DB user.",
    "sql_injection_pattern":      "Use parameterised queries or an ORM; never concatenate user input into SQL.",
    "eval_injection":             "Remove eval(); use safe alternatives; apply strict input validation.",
    "command_injection":          "Use subprocess with a list of arguments, never shell=True with user input.",
    "path_traversal":             "Sanitize paths with os.path.realpath(); validate against allowed directories.",
    "xxe_pattern":                "Disable external entity processing in your XML parser.",
    "ssrf_pattern":               "Validate and allowlist outbound URL destinations; block internal networks.",
    "xss_pattern":                "HTML-encode all user-supplied output; implement a strict Content-Security-Policy.",
    "weak_crypto_md5":            "Replace MD5 with SHA-256 or SHA-3; for passwords use bcrypt/argon2.",
    "weak_crypto_sha1":           "Replace SHA-1 with SHA-256 for integrity; use SHA-3 for new designs.",
    "insecure_random":            "Use secrets.SystemRandom() or os.urandom() for security-sensitive randomness.",
    "debug_mode_enabled":         "Disable DEBUG mode in production; gate debug endpoints with authentication.",
    "insecure_deserialization":   "Use safe serialisation formats (JSON); apply strict type constraints.",
    "open_redirect":              "Validate redirect targets against a server-side whitelist.",
    "credit_card_number":         "Remove PAN from logs/code; apply PCI DSS tokenisation; use vault.",
    "social_security_number":     "Remove SSN from non-production systems; apply data minimisation.",
    "email_address":              "Mask email in logs; ensure GDPR compliance for stored personal data.",
    "iban_number":                "Remove IBAN from logs/code; tokenise financial data.",
    "prompt_injection":           "Apply prompt sandboxing; delimit user/system context; use output validators.",
    "jailbreak_attempt":          "Apply input classifiers; harden system prompt; use guardrail layers.",
    "pii_exfiltration_attempt":   "Apply output filtering; monitor LLM responses for PII patterns.",
    "iac_public_s3_bucket":       "Enable S3 Block Public Access; use bucket policies with explicit denies.",
    "iac_overly_permissive_iam":  "Apply least-privilege IAM; replace wildcards with specific action/resource ARNs.",
    "iac_no_tls":                 "Enable TLS 1.2+ on all endpoints; enforce HTTPS-only communication.",
}


def get_cvss_for_finding(finding_type: str) -> tuple[float, str, str]:
    """
    Returns (cvss_score, severity_label, cvss_vector_string) for a known finding type.
    Falls back to a medium-severity generic vector.
    """
    vec_str = FINDING_VECTORS.get(finding_type, "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N")
    score, severity = score_from_vector_string(vec_str)
    return score, severity, vec_str


def get_cwe(finding_type: str) -> Optional[str]:
    return FINDING_CWE.get(finding_type)


def get_remediation(finding_type: str) -> str:
    return FINDING_REMEDIATION.get(finding_type, "Review the finding and apply the principle of least privilege.")
