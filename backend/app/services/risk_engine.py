from __future__ import annotations

import math
from typing import Any, Dict, Iterable, List, Tuple


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except Exception:
        return default


def _normalize(value: float, min_v: float, max_v: float) -> float:
    if max_v <= min_v:
        return 0.0
    return (value - min_v) / (max_v - min_v)


def _log1p_scale(x: float) -> float:
    return math.log1p(max(0.0, x))


def compute_risk_scores(findings: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Compute frank, reproducible risk scores for a batch of findings.

    This function combines deterministic signals (CVSS, severity mapping,
    asset criticality, occurrence counts, and age) with a lightweight
    statistical anomaly signal computed from z-scores across the batch.

    Returns a list of findings augmented with `risk_score` (0-10 float) and
    `explanation` (dict) containing the feature contributions.
    """
    items = []
    for f in findings:
        items.append({
            "cvss": _safe_float(f.get("cvss_score", f.get("cvss", 0.0))),
            "criticality": float(f.get("asset_criticality", f.get("criticality", 5.0))),
            "occurrence": float(f.get("occurrence_count", f.get("occurrences", 0)) or 0),
            "age_days": float(f.get("age_days", 0.0) or 0.0),
            "meta": f,
        })

    # Build feature arrays
    cvss_vals = [it["cvss"] for it in items]
    crit_vals = [it["criticality"] for it in items]
    occ_vals = [it["occurrence"] for it in items]
    age_vals = [it["age_days"] for it in items]

    def _stats(arr: List[float]) -> Tuple[float, float]:
        if not arr:
            return 0.0, 0.0
        n = len(arr)
        mean = sum(arr) / n
        var = sum((x - mean) ** 2 for x in arr) / n
        std = math.sqrt(var)
        return mean, std

    cvss_mean, cvss_std = _stats(cvss_vals)
    crit_mean, crit_std = _stats(crit_vals)
    occ_mean, occ_std = _stats(occ_vals)
    age_mean, age_std = _stats(age_vals)

    results: List[Dict[str, Any]] = []
    for i, it in enumerate(items):
        cvss = it["cvss"]
        crit = it["criticality"]
        occ = it["occurrence"]
        age = it["age_days"]

        # Normalize base signals
        norm_cvss = _normalize(cvss, 0.0, 10.0)
        norm_crit = _normalize(crit, 0.0, 10.0)
        # Occurrence: use log1p to compress long-tailed counts
        norm_occ = _log1p_scale(occ) / (_log1p_scale(max(1.0, max(occ_vals))) or 1.0)
        norm_age = _log1p_scale(age) / (_log1p_scale(max(1.0, max(age_vals))) or 1.0)

        # Statistical anomaly score via z-scores (max absolute z across features)
        z_cvss = abs((cvss - cvss_mean) / cvss_std) if cvss_std > 0 else 0.0
        z_crit = abs((crit - crit_mean) / crit_std) if crit_std > 0 else 0.0
        z_occ = abs((occ - occ_mean) / occ_std) if occ_std > 0 else 0.0
        z_age = abs((age - age_mean) / age_std) if age_std > 0 else 0.0
        max_z = max(z_cvss, z_crit, z_occ, z_age)

        # Convert max_z to a bounded anomaly factor in [0,1] using a smooth transform
        anomaly = 1.0 - (1.0 / (1.0 + max_z))

        # Combine features into a base score
        base = (0.6 * norm_cvss) + (0.3 * norm_crit) + (0.07 * norm_occ) + (0.03 * norm_age)

        # Amplify by anomaly factor (up to +50%) and map to 0-10
        amplified = base * (1.0 + 0.5 * anomaly)
        risk_score = max(0.0, min(10.0, amplified * 10.0))

        explanation = {
            "norm_cvss": round(norm_cvss, 4),
            "norm_criticality": round(norm_crit, 4),
            "norm_occurrence": round(norm_occ, 4),
            "norm_age": round(norm_age, 4),
            "anomaly": round(anomaly, 4),
            "base_combination": round(base, 4),
        }

        out = dict(it["meta"])
        out.update({"risk_score": round(risk_score, 2), "explanation": explanation})
        results.append(out)

    return results
