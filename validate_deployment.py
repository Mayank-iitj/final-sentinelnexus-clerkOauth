#!/usr/bin/env python3
"""
Production Deployment Validation Script

Validates that a deployed SentinelNexus instance is healthy and properly configured.

Usage:
  python validate_deployment.py [--backend-url] [--frontend-url]

Example:
  python validate_deployment.py \
    --backend-url https://sentinelnexus-api-xyz.a.run.app \
    --frontend-url https://sentinelnexus.ai
"""

import sys
import requests
import json
import argparse
from typing import Dict, Tuple
from urllib.parse import urljoin

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_section(title: str):
    """Print a formatted section header."""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}{title}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def print_check(name: str, passed: bool, details: str = ""):
    """Print a check result with color coding."""
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    message = f"  {status}  {name}"
    if details:
        message += f" ({details})"
    print(message)
    return passed


def check_backend_health(backend_url: str) -> Tuple[bool, Dict]:
    """Check backend health endpoint."""
    print_section("Backend Health Checks")
    
    all_passed = True
    
    # Check 1: Basic connectivity
    try:
        response = requests.get(urljoin(backend_url, "/health"), timeout=10)
        passed = response.status_code == 200
        all_passed &= print_check("Backend connectivity", passed, f"HTTP {response.status_code}")
        
        if passed:
            data = response.json()
            db_ok = data.get("db") == "ok"
            redis_ok = data.get("redis") in ["ok", "degraded"]
            
            all_passed &= print_check("Database connection", db_ok)
            all_passed &= print_check("Redis connection", redis_ok, data.get("redis"))
    except Exception as e:
        all_passed &= print_check("Backend connectivity", False, str(e))
    
    # Check 2: OAuth providers
    try:
        response = requests.get(urljoin(backend_url, "/api/v1/auth/providers"), timeout=10)
        passed = response.status_code == 200
        all_passed &= print_check("OAuth endpoints accessible", passed)
        
        if passed:
            data = response.json()
            google_enabled = data.get("google", False)
            all_passed &= print_check("Google OAuth enabled", google_enabled)
    except Exception as e:
        all_passed &= print_check("OAuth endpoints accessible", False, str(e))
    
    # Check 3: API endpoints
    try:
        response = requests.get(urljoin(backend_url, "/api/v1/"), timeout=10)
        # 404 is OK, means proxy is working
        all_passed &= print_check("API proxy route accessible", response.status_code in [200, 404])
    except Exception as e:
        all_passed &= print_check("API proxy route accessible", False, str(e))
    
    return all_passed, {}


def check_frontend_health(frontend_url: str, backend_url: str) -> Tuple[bool, Dict]:
    """Check frontend health and connectivity."""
    print_section("Frontend Health Checks")
    
    all_passed = True
    
    # Check 1: Frontend loads
    try:
        response = requests.get(frontend_url, timeout=10, allow_redirects=True)
        passed = response.status_code == 200
        all_passed &= print_check("Frontend homepage loads", passed, f"HTTP {response.status_code}")
    except Exception as e:
        all_passed &= print_check("Frontend homepage loads", False, str(e))
    
    # Check 2: Login page loads
    try:
        response = requests.get(urljoin(frontend_url, "/login"), timeout=10)
        passed = response.status_code == 200
        all_passed &= print_check("Login page loads", passed, f"HTTP {response.status_code}")
    except Exception as e:
        all_passed &= print_check("Login page loads", False, str(e))
    
    # Check 3: API proxy accessible from frontend
    try:
        response = requests.get(urljoin(frontend_url, "/api/v1/health"), timeout=10)
        passed = response.status_code == 200
        all_passed &= print_check("Frontend can reach backend (via proxy)", passed)
    except Exception as e:
        all_passed &= print_check("Frontend can reach backend (via proxy)", False, str(e))
    
    # Check 4: HTTPS
    try:
        passed = frontend_url.startswith("https://")
        all_passed &= print_check("HTTPS enabled", passed)
    except Exception as e:
        all_passed &= print_check("HTTPS enabled", False, str(e))
    
    return all_passed, {}


def check_ssl_certificates(frontend_url: str, backend_url: str) -> Tuple[bool, Dict]:
    """Check SSL certificate validity."""
    print_section("SSL Certificate Checks")
    
    all_passed = True
    
    # Check frontend SSL
    try:
        response = requests.head(frontend_url, timeout=10)
        headers = response.headers
        hsts = "strict-transport-security" in headers
        all_passed &= print_check("Frontend HSTS enabled", hsts)
    except Exception as e:
        all_passed &= print_check("Frontend HSTS enabled", False, str(e))
    
    # Check backend SSL
    try:
        response = requests.head(backend_url, timeout=10)
        headers = response.headers
        hsts = "strict-transport-security" in headers
        all_passed &= print_check("Backend HSTS enabled", hsts)
    except Exception as e:
        all_passed &= print_check("Backend HSTS enabled", False, str(e))
    
    return all_passed, {}


def check_cors_headers(backend_url: str, frontend_url: str) -> Tuple[bool, Dict]:
    """Check CORS configuration."""
    print_section("CORS Configuration Checks")
    
    all_passed = True
    
    try:
        headers = {"Origin": frontend_url}
        response = requests.options(urljoin(backend_url, "/api/v1/health"), headers=headers, timeout=10)
        
        cors_origin = response.headers.get("access-control-allow-origin", "")
        cors_allowed = cors_origin in [frontend_url, "*"] or frontend_url in cors_origin
        
        all_passed &= print_check("CORS headers present", cors_allowed, f"Allow-Origin: {cors_origin}")
        
        if cors_allowed:
            methods = response.headers.get("access-control-allow-methods", "")
            all_passed &= print_check("CORS methods allowed", bool(methods), f"Methods: {methods}")
    except Exception as e:
        all_passed &= print_check("CORS headers present", False, str(e))
    
    return all_passed, {}


def check_security_headers(frontend_url: str) -> Tuple[bool, Dict]:
    """Check important security headers."""
    print_section("Security Headers Checks")
    
    all_passed = True
    
    try:
        response = requests.head(frontend_url, timeout=10)
        headers = response.headers
        
        # Check for important security headers
        required_headers = {
            "x-content-type-options": "nosniff",
            "x-frame-options": "SAMEORIGIN",
            "x-xss-protection": "1; mode=block",
        }
        
        for header, expected in required_headers.items():
            has_header = header.lower() in [h.lower() for h in headers.keys()]
            all_passed &= print_check(f"Security header present: {header}", has_header)
        
    except Exception as e:
        all_passed &= print_check("Security headers", False, str(e))
    
    return all_passed, {}


def check_database_credentials(backend_url: str) -> Tuple[bool, Dict]:
    """Check if database is accessible (via health endpoint)."""
    print_section("Database Connectivity Checks")
    
    all_passed = True
    
    try:
        response = requests.get(urljoin(backend_url, "/health"), timeout=10)
        if response.status_code == 200:
            data = response.json()
            db_status = data.get("db") == "ok"
            all_passed &= print_check("Database accessible", db_status)
    except Exception as e:
        all_passed &= print_check("Database accessible", False, str(e))
    
    return all_passed, {}


def run_full_validation(backend_url: str, frontend_url: str) -> bool:
    """Run all validation checks."""
    
    print(f"\n{BOLD}{BLUE}SentinelNexus Production Deployment Validator{RESET}")
    print(f"Backend:  {backend_url}")
    print(f"Frontend: {frontend_url}\n")
    
    results = []
    
    # Run all checks
    results.append(check_backend_health(backend_url))
    results.append(check_frontend_health(frontend_url, backend_url))
    results.append(check_ssl_certificates(frontend_url, backend_url))
    results.append(check_cors_headers(backend_url, frontend_url))
    results.append(check_security_headers(frontend_url))
    results.append(check_database_credentials(backend_url))
    
    # Summary
    print_section("Summary")
    
    all_passed = all(result[0] for result in results)
    
    if all_passed:
        print(f"{GREEN}{BOLD}✓ All validation checks passed!{RESET}\n")
        print("Your SentinelNexus deployment is production-ready.")
    else:
        print(f"{RED}{BOLD}✗ Some validation checks failed.{RESET}\n")
        print("Please review the errors above and address any issues.")
        print("\nCommon issues:")
        print("  - CORS errors: Check ALLOWED_ORIGINS in backend config")
        print("  - SSL errors: Verify domain certificates are valid")
        print("  - Backend unreachable: Check backend deployment status")
        print("  - Database errors: Verify DATABASE_URL and credentials")
    
    return all_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate SentinelNexus production deployment")
    parser.add_argument("--backend-url", required=True, help="Backend URL (e.g., https://api.sentinelnexus.ai)")
    parser.add_argument("--frontend-url", required=True, help="Frontend URL (e.g., https://sentinelnexus.ai)")
    
    args = parser.parse_args()
    
    success = run_full_validation(args.backend_url, args.frontend_url)
    
    sys.exit(0 if success else 1)
