from app.services.scanners.code_scanner import CodeSecurityScanner


def test_hardcoded_api_key_detection():
    code = '''
    api_key = "sk-OPENAI-DUMMY-KEY-FOR-TESTING-PURPOSES"
    '''
    findings, score = CodeSecurityScanner.scan_code(code)
    assert any(f.finding_type == "hardcoded_api_key" for f in findings)
    assert score >= 7

