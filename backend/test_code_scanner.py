"""Quick test of the Code Security Scanner engine."""

from app.services.scanners.code_scanner import CodeSecurityScanner

# Sample vulnerable code to scan
SAMPLE_CODE = '''
import os
import subprocess

# Hardcoded secrets
api_key = "sk-DUMMY-OPENAI-KEY-FOR-TESTING-123456"
password = "DUMMY_PASSWORD_123"
db_url = "postgresql://dummy_user:dummy_pass@localhost:5432/dummy_db"
aws_key = "AKIA_DUMMY_AWS_KEY_FOR_TESTING"

# SQL Injection
def get_user(username):
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    cursor.execute(query)

# Command Injection
def run_cmd(user_input):
    os.system("ls " + user_input)
    subprocess.call(user_input, shell=True)

# Eval injection
def process(data):
    result = eval(data)
    return result

# Weak crypto
import hashlib
hash_val = hashlib.md5(b"sensitive data").hexdigest()

# Debug mode
DEBUG = True
app.run(debug=True)

# XSS pattern
html = "<div>" + user_input + "</div>"
'''

print("=" * 60)
print("  SentinelNexus Code Security Scanner - Test Run")
print("=" * 60)

findings, score = CodeSecurityScanner.scan_code(SAMPLE_CODE, target="test_sample.py")
risk_level = CodeSecurityScanner.get_risk_level(score)

print(f"\n  Risk Level : {risk_level.upper()}")
print(f"  Score      : {score}/100")
print(f"  Findings   : {len(findings)}")
print("-" * 60)

for i, f in enumerate(findings, 1):
    print(f"\n  [{i}] {f.finding_type}")
    print(f"      Severity : {f.severity} (CVSS {f.cvss_score})")
    print(f"      CWE      : {f.cwe or 'N/A'}")
    print(f"      Line     : {f.line_number or 'N/A'}")
    print(f"      Evidence : {f.evidence[:80]}...")
    print(f"      Fix      : {f.remediation[:80]}...")

print("\n" + "=" * 60)
print("  Scan complete!")
print("=" * 60)
