"""
Finding Deduplication Service
===============================
Computes SHA-256 fingerprints for findings so that identical issues
detected across multiple scans of the same target are flagged once.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


def _normalize(value: str) -> str:
    """Strip whitespace and lower-case for stable hashing."""
    return value.strip().lower()


def fingerprint(
    *,
    scan_target: str,
    finding_type: str,
    evidence: str,
    line_number: int | None = None,
) -> str:
    """
    Return a stable hex fingerprint for a finding.
    Evidence is truncated and normalised before hashing to avoid
    minor formatting differences creating phantom duplicates.
    """
    evidence_sample = _normalize(evidence[:256])
    payload = json.dumps(
        {
            "target": _normalize(scan_target),
            "type": _normalize(finding_type),
            "evidence": evidence_sample,
            "line": line_number,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def deduplicate(findings: List[Dict[str, Any]], scan_target: str) -> List[Dict[str, Any]]:
    """
    Remove duplicate findings within a single scan result list.
    Findings are deduplicated by their computed fingerprint; the first
    occurrence is kept and subsequent ones dropped.
    """
    seen: set[str] = set()
    unique: list[Dict[str, Any]] = []
    for f in findings:
        fp = fingerprint(
            scan_target=scan_target,
            finding_type=f.get("finding_type", ""),
            evidence=f.get("evidence", ""),
            line_number=f.get("line_number"),
        )
        f["fingerprint"] = fp
        if fp not in seen:
            seen.add(fp)
            unique.append(f)
    return unique
