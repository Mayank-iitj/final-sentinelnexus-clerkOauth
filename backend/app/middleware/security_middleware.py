"""
SecurityMiddleware — Production Multi-Layer Threat Engine
==========================================================
Orchestrates 6 detection layers in order for every incoming
POST/PUT/PATCH request. Pure ASGI class (not BaseHTTPMiddleware)
for explicit ASGI receive-channel reconstruction.

Layer 0: IP ban check (Redis) — fastest, no body read
Layer 1: Body extraction + obfuscation unwrapping (recursive decode)
Layer 2: Pattern detectors (SQLi, cmd, prompt, traversal/SSRF/XXE/SSTI)
         Applied to BOTH original text AND decoded text
Layer 3: RAG semantic scorer (cosine similarity, 350-entry corpus)
Layer 4: Entropy / statistical anomaly (inside obfuscation detector)
Layer 5: Risk score aggregation → block / warn / pass decision
Layer 6: Redis attack counter + auto-ban (post-decision, on block/warn)

Automated blocking:
  SECURITY_SHADOW_MODE=false → requests scoring ≥ BLOCK_THRESHOLD return 400
  SECURITY_SHADOW_MODE=true  → log only, never block (override for testing)

Fail-open:
  SECURITY_FAIL_OPEN=true (default) → middleware exceptions pass through

ASGI receive reconstruction:
  Body is read once, then a new receive() closure replays it so all
  downstream middleware and route handlers (including Clerk webhook
  which calls request.body() + request.json()) still get the full body.

Log format (WARNING level, JSON):
  {
    "event": "block"|"warn",
    "shadow": true|false,
    "score": 92.3,
    "decision": "block",
    "primary_kind": "sqli",
    "all_kinds": ["sqli", "semantic_sqli"],
    "obfuscated": false,
    "path": "/api/v1/scans",
    "method": "POST",
    "ip": "1.2.3.4",
    "request_id": "uuid",
    "evidence": "... redacted ...",
    "attack_count": 2
  }
"""
from __future__ import annotations

import json
import os
import re
from typing import Optional

from loguru import logger
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.security.detectors.sqli import check_sqli
from app.security.detectors.cmd_injection import check_cmd_injection
from app.security.detectors.prompt_injection import check_prompt_injection
from app.security.detectors.obfuscation import check_obfuscation
from app.security.detectors.traversal_ssrf import check_traversal_ssrf
from app.security.semantic import score_text
from app.security.scoring import aggregate, ThreatAssessment, BLOCK_THRESHOLD, WARN_THRESHOLD
from app.security.rate_limiter import is_banned, record_attack, _get_ip

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def _env_bool(name: str, default: bool) -> bool:
    val = os.environ.get(name, "").strip().lower()
    if val in ("1", "true", "yes", "on"):
        return True
    if val in ("0", "false", "no", "off"):
        return False
    return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, ""))
    except (ValueError, TypeError):
        return default


def _env_list(name: str, default: list[str]) -> list[str]:
    val = os.environ.get(name, "").strip()
    return [v.strip() for v in val.split(",") if v.strip()] if val else default


SHADOW_MODE: bool = _env_bool("SECURITY_SHADOW_MODE", default=True)
FAIL_OPEN: bool = _env_bool("SECURITY_FAIL_OPEN", default=True)
MAX_BODY_BYTES: int = _env_int("SECURITY_MAX_BODY_BYTES", default=65_536)
SKIP_PATHS: list[str] = _env_list(
    "SECURITY_SKIP_PATHS", default=["/health", "/metrics", "/"]
)

# PII redaction patterns for log-safe evidence
_PII_PATTERNS = [
    (re.compile(r"\b(?:\d{4}[\s\-]){3}\d{4}\b"), "****-****-****-****"),
    (re.compile(r"\b\d{3}[\s\-]\d{2}[\s\-]\d{4}\b"), "***-**-****"),
    (re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"), "[email]"),
    (re.compile(r"\+?1?[\s.\-]?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}"), "[phone]"),
    (re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"), "[ip]"),
]


def _redact(text: str) -> str:
    for pat, repl in _PII_PATTERNS:
        text = pat.sub(repl, text)
    return text


# ---------------------------------------------------------------------------
# JSON body string extraction
# ---------------------------------------------------------------------------

def _flatten_strings(obj: object, depth: int = 0) -> str:
    if depth > 8:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        return "\n".join(_flatten_strings(v, depth + 1) for v in obj.values())
    if isinstance(obj, list):
        return "\n".join(_flatten_strings(i, depth + 1) for i in obj)
    return ""


def _extract_text(raw_body: bytes) -> str:
    """Extract all string content from the body for scanning."""
    try:
        text = raw_body.decode("utf-8", errors="replace")
    except Exception:
        return ""
    try:
        parsed = json.loads(text)
        return _flatten_strings(parsed)
    except (json.JSONDecodeError, ValueError):
        return text


# ---------------------------------------------------------------------------
# Blocked response
# ---------------------------------------------------------------------------

async def _send_blocked(scope: Scope, send: Send, score: float, kind: str) -> None:
    resp = JSONResponse(
        status_code=400,
        content={
            "detail": "Request blocked by security policy",
            "code": "SECURITY_BLOCK",
        },
    )
    # Pass _dead_receive as a callable, NOT as a called coroutine
    await resp(scope, _dead_receive, send)


async def _dead_receive() -> Message:
    return {"type": "http.disconnect"}


# ---------------------------------------------------------------------------
# Main Middleware
# ---------------------------------------------------------------------------

class SecurityMiddleware:
    """
    Production multi-layer security middleware.
    Placed as 2nd-outermost middleware in create_app():

        RequestLoggingMiddleware  ← outermost
        SecurityMiddleware        ← this (2nd)
        SecurityHeadersMiddleware
        CORSMiddleware
        SessionMiddleware         ← innermost
    """

    _INSPECT_METHODS = frozenset({"POST", "PUT", "PATCH"})

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.shadow_mode = SHADOW_MODE
        self.fail_open = FAIL_OPEN
        self.max_body_bytes = MAX_BODY_BYTES
        self.skip_paths = SKIP_PATHS

        mode = "SHADOW (log-only)" if self.shadow_mode else "ENFORCEMENT (auto-blocking ON)"
        logger.info(
            f"SecurityMiddleware v2 ready — mode={mode} "
            f"block_threshold={BLOCK_THRESHOLD} warn_threshold={WARN_THRESHOLD} "
            f"fail_open={self.fail_open}"
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "/")
        method: str = scope.get("method", "GET")

        # ── Skip paths ──────────────────────────────────────────────────────
        if any(path == s or path.startswith(s + "/") for s in self.skip_paths):
            await self.app(scope, receive, send)
            return

        # ── Layer 0: IP ban check ───────────────────────────────────────────
        ip = _get_ip(scope)
        try:
            redis = self._get_redis(scope)
            if await is_banned(redis, ip):
                logger.warning(json.dumps({
                    "event": "ip_banned",
                    "ip": ip,
                    "path": path,
                    "method": method,
                }))
                if not self.shadow_mode:
                    await _send_blocked(scope, send, score=100.0, kind="ip_banned")
                    return
        except Exception as exc:
            if not self.fail_open:
                raise
            logger.error(f"SecurityMiddleware Layer0 error (fail-open): {exc}")

        # ── Only inspect mutable-body methods ──────────────────────────────
        if method not in self._INSPECT_METHODS:
            await self.app(scope, receive, send)
            return

        raw_body = b""
        try:
            # ── Read + reconstruct body ─────────────────────────────────────
            raw_body, reconstructed_receive = await self._read_and_reconstruct(receive)

            # ── Extract text ────────────────────────────────────────────────
            original_text = _extract_text(raw_body)

            # ── Layer 1: Obfuscation unwrap ─────────────────────────────────
            obf_result, decoded_text = check_obfuscation(original_text)

            # ── Layer 2: Pattern detectors — on ORIGINAL and DECODED text ──
            scan_texts = [original_text]
            if decoded_text != original_text:
                scan_texts.append(decoded_text)

            pattern_results = []
            for text in scan_texts:
                if not text.strip():
                    continue
                pattern_results.extend([
                    check_sqli(text),
                    check_cmd_injection(text),
                    check_prompt_injection(text),
                    check_traversal_ssrf(text),
                ])

            # Deduplicate by kind (keep highest score per kind)
            best_by_kind: dict[str, object] = {}
            for r in pattern_results:
                if r.hit:
                    existing = best_by_kind.get(r.kind)
                    if existing is None or r.score > existing.score:  # type: ignore[union-attr]
                        best_by_kind[r.kind] = r
            deduped_results = list(best_by_kind.values())

            # ── Layer 3: RAG semantic scorer ────────────────────────────────
            for text in scan_texts:
                sem_result = score_text(text)
                if sem_result.hit:
                    deduped_results.append(sem_result)

            # ── Layer 5: Risk aggregation ───────────────────────────────────
            assessment = aggregate(
                deduped_results,  # type: ignore[arg-type]
                obfuscation_score=obf_result.score if obf_result.hit else 0.0,
                obfuscation_techniques=obf_result.matches if obf_result.hit else None,
            )

            # ── Decide + act ────────────────────────────────────────────────
            if assessment.decision in ("block", "warn"):
                req_id = ""
                for k, v in scope.get("headers", []):
                    if k == b"x-request-id":
                        req_id = v.decode("utf-8", errors="replace")
                        break

                # Layer 6: record attack for rate-limiter auto-ban
                attack_count = 0
                if assessment.decision == "block":
                    try:
                        attack_count = await record_attack(redis, ip)
                    except Exception:
                        pass

                import time
                evidence = _redact((original_text or "")[:500])
                log_entry = {
                    "event": assessment.decision,
                    "shadow": self.shadow_mode,
                    "score": assessment.score,
                    "decision": assessment.decision,
                    "primary_kind": assessment.primary_kind,
                    "all_kinds": assessment.all_kinds,
                    "obfuscated": assessment.obfuscated,
                    "path": path,
                    "method": method,
                    "ip": ip,
                    "request_id": req_id,
                    "evidence": evidence,
                    "attack_count": attack_count,
                    "detector_scores": assessment.detector_scores,
                    "timestamp": time.time(),
                }
                log_json = json.dumps(log_entry)
                logger.warning(log_json)

                # Push to Redis for the Security Telemetry dashboard
                if redis is not None:
                    try:
                        await redis.lpush("sec:events", log_json)
                        await redis.ltrim("sec:events", 0, 999) # Keep latest 1000
                    except Exception as exc:
                        logger.error(f"Failed to push security event to Redis: {exc}")

                if assessment.decision == "block" and not self.shadow_mode:
                    await _send_blocked(scope, send, assessment.score, assessment.primary_kind)
                    return

            # Pass through (shadow mode or warn/pass decision)
            await self.app(scope, reconstructed_receive, send)

        except Exception as exc:
            if self.fail_open:
                logger.error(
                    f"SecurityMiddleware internal error (fail-open): "
                    f"{type(exc).__name__}: {exc}"
                )
                try:
                    safe_receive = self._make_receive(raw_body)
                except Exception:
                    safe_receive = receive
                await self.app(scope, safe_receive, send)
            else:
                raise

    # ── Private helpers ──────────────────────────────────────────────────────

    def _get_redis(self, scope: Scope):
        """Access the app's Redis instance from ASGI scope."""
        try:
            app = scope.get("app")
            if app is not None:
                return getattr(getattr(app, "state", None), "redis", None)
        except Exception:
            pass
        return None

    async def _read_and_reconstruct(
        self, receive: Receive
    ) -> tuple[bytes, Receive]:
        """Read full body and return (body_bytes, reconstructed_receive)."""
        chunks: list[bytes] = []
        overflow: list[bytes] = []
        total = 0

        while True:
            message: Message = await receive()
            if message["type"] == "http.request":
                chunk: bytes = message.get("body", b"")
                if total < self.max_body_bytes:
                    take = min(len(chunk), self.max_body_bytes - total)
                    chunks.append(chunk[:take])
                    if take < len(chunk):
                        overflow.append(chunk[take:])
                    total += take
                else:
                    overflow.append(chunk)
                if not message.get("more_body", False):
                    break
            elif message["type"] == "http.disconnect":
                break

        body = b"".join(chunks)
        full_body = body + b"".join(overflow)
        return body, self._make_receive(full_body)

    @staticmethod
    def _make_receive(body: bytes) -> Receive:
        """Build a receive callable that replays `body` once then disconnects."""
        messages: list[Message] = [
            {"type": "http.request", "body": body, "more_body": False},
            {"type": "http.disconnect"},
        ]
        idx = 0

        async def receive() -> Message:
            nonlocal idx
            if idx < len(messages):
                msg = messages[idx]
                idx += 1
                return msg
            return {"type": "http.disconnect"}

        return receive
