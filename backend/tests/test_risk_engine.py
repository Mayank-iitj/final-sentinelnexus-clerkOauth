from app.services.risk_engine import compute_risk_scores


def test_compute_risk_scores_basic():
    findings = [
        {"id": "f1", "cvss_score": 9.8, "asset_criticality": 9, "occurrence_count": 1, "age_days": 2},
        {"id": "f2", "cvss_score": 4.3, "asset_criticality": 5, "occurrence_count": 10, "age_days": 30},
        {"id": "f3", "cvss_score": 0.0, "asset_criticality": 3, "occurrence_count": 0, "age_days": 0},
    ]

    results = compute_risk_scores(findings)
    assert isinstance(results, list)
    assert len(results) == 3
    for r in results:
        assert "risk_score" in r
        assert 0.0 <= r["risk_score"] <= 10.0
        assert "explanation" in r
