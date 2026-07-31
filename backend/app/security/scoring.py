"""
Risk Score Aggregation Engine
===============================
Combines outputs from all detectors into a final 0–100 risk score
and decides block / warn / pass.

Scoring design:
  - Each detector returns a base score (0–100)
  - Obfuscation detected: 1.5× multiplier on all other detector scores
  - Multiple independent detector hits: scores are combined as
      combined = max_score + Σ(other_scores * 0.3)
    (diminishing returns — two medium hits ≠ two high hits stacked)
  - Semantic score is additive but capped at +30 bonus
  - Final score clamped to [0, 100]

Decision thresholds (env-configurable):
  score ≥ SECURITY_BLOCK_SCORE_THRESHOLD (default 80): BLOCK
  score ≥ SECURITY_WARN_SCORE_THRESHOLD  (default 50): WARN log only
  score <  warn threshold: PASS silently
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List, Optional

from app.security.detectors.sqli import DetectorResult


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, ""))
    except (ValueError, TypeError):
        return default


BLOCK_THRESHOLD: float = _env_float("SECURITY_BLOCK_SCORE_THRESHOLD", 80.0)
WARN_THRESHOLD: float = _env_float("SECURITY_WARN_SCORE_THRESHOLD", 50.0)

OBFUSCATION_MULTIPLIER = 1.5
SECONDARY_HIT_WEIGHT = 0.30
MAX_SEMANTIC_BONUS = 30.0


@dataclass
class ThreatAssessment:
    score: float                         # 0–100 final risk score
    decision: str                        # "block" | "warn" | "pass"
    primary_kind: str                    # highest-scoring detector kind
    all_kinds: list[str]                 # all triggered detector kinds
    confidence: float                    # 0–1
    obfuscated: bool
    detector_scores: dict[str, float]    # per-detector scores for logging


def aggregate(
    results: list[DetectorResult],
    *,
    obfuscation_score: float = 0.0,
    obfuscation_techniques: Optional[list[str]] = None,
) -> ThreatAssessment:
    """
    Aggregate detector results into a final ThreatAssessment.

    Args:
        results: outputs from all pattern detectors (excl. obfuscation)
        obfuscation_score: score from obfuscation detector (0–100)
        obfuscation_techniques: list of detected obfuscation techniques
    """
    hits = [r for r in results if r.hit and r.score > 0]
    obfuscated = obfuscation_score > 0

    detector_scores: dict[str, float] = {}
    for r in results:
        detector_scores[r.kind] = r.score
    if obfuscated:
        detector_scores["obfuscation"] = obfuscation_score

    if not hits and not obfuscated:
        return ThreatAssessment(
            score=0.0, decision="pass", primary_kind="none",
            all_kinds=[], confidence=0.0, obfuscated=False,
            detector_scores={},
        )

    # Sort hits by score descending
    hits_sorted = sorted(hits, key=lambda r: r.score, reverse=True)

    if not hits_sorted:
        # Only obfuscation triggered
        final = obfuscation_score
        return ThreatAssessment(
            score=min(final, 100.0),
            decision=_decide(final),
            primary_kind="obfuscation",
            all_kinds=["obfuscation"],
            confidence=0.40,
            obfuscated=True,
            detector_scores=detector_scores,
        )

    # Primary score = highest single detector
    primary = hits_sorted[0]
    combined_score = primary.score

    # Diminishing secondary hits
    for r in hits_sorted[1:]:
        combined_score += r.score * SECONDARY_HIT_WEIGHT

    # Apply obfuscation multiplier
    if obfuscated:
        combined_score *= OBFUSCATION_MULTIPLIER
        combined_score += obfuscation_score * 0.20  # add small flat bonus

    # Separate out semantic results (add as capped bonus, not multiplied)
    semantic_bonus = 0.0
    non_semantic_hits = []
    for r in hits_sorted:
        if r.kind.startswith("semantic"):
            semantic_bonus += r.score * 0.40
        else:
            non_semantic_hits.append(r)

    if non_semantic_hits:
        combined_score += min(semantic_bonus, MAX_SEMANTIC_BONUS)
    else:
        # Only semantic hits — use semantic score directly (lower weight)
        combined_score = min(semantic_bonus, 65.0)

    final_score = min(combined_score, 100.0)
    best_confidence = max((r.confidence for r in hits_sorted), default=0.0)

    return ThreatAssessment(
        score=round(final_score, 1),
        decision=_decide(final_score),
        primary_kind=primary.kind,
        all_kinds=[r.kind for r in hits_sorted],
        confidence=best_confidence,
        obfuscated=obfuscated,
        detector_scores=detector_scores,
    )


def _decide(score: float) -> str:
    if score >= BLOCK_THRESHOLD:
        return "block"
    if score >= WARN_THRESHOLD:
        return "warn"
    return "pass"
