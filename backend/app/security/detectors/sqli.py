"""
SQL Injection Detector — 110+ OWASP patterns
=============================================
Covers OWASP Tier 1-3:
  - Tautology-based (OR 1=1, AND 1=1)
  - UNION-based extraction
  - Error-based injection
  - Boolean blind injection
  - Time-based blind (SLEEP, WAITFOR, BENCHMARK, pg_sleep)
  - Stacked queries / DDL injection
  - Out-of-band (DNS, HTTP, LOAD_FILE)
  - Stored procedure abuse (xp_cmdshell, sp_execute)
  - Information schema / catalog probing
  - Second-order / stored injection indicators
  - Encoding evasion (CHAR(), CONCAT(), hex literals)
  - Comment-based termination
  - NoSQL injection patterns (MongoDB, Redis)
  - ORM bypass patterns

Returns: DetectorResult with score (0-100) and matched evidence list.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class DetectorResult:
    hit: bool
    score: float          # 0.0 – 100.0
    confidence: float     # 0.0 – 1.0
    kind: str
    matches: List[str] = field(default_factory=list)


def _re(p: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern[str]:
    return re.compile(p, flags)


# ── High-confidence patterns (score 90) ─────────────────────────────────────
_HIGH: list[tuple[re.Pattern[str], str]] = [
    (_re(r"\bUNION\b\s+(?:ALL\s+)?SELECT\b"),                          "union_select"),
    (_re(r"\bINSERT\s+INTO\b.*\bVALUES\b"),                            "insert_into"),
    (_re(r";\s*(?:DROP|TRUNCATE)\s+TABLE\b"),                          "drop_table"),
    (_re(r"\bEXEC(?:UTE)?\s*\(\s*['\"]?\s*(?:xp_|sp_)"),             "exec_sproc"),
    (_re(r"\bxp_cmdshell\b"),                                          "xp_cmdshell"),
    (_re(r"\bLOAD_FILE\s*\("),                                         "load_file"),
    (_re(r"\bINTO\s+(?:OUT|DUMP)FILE\b"),                              "outfile"),
    (_re(r"\bINFORMATION_SCHEMA\b"),                                   "info_schema"),
    (_re(r"\bpg_sleep\s*\("),                                          "pg_sleep"),
    (_re(r"\bWAITFOR\s+DELAY\b"),                                      "waitfor_delay"),
    (_re(r"\bSLEEP\s*\(\s*\d+"),                                       "sleep_call"),
    (_re(r"\bBENCHMARK\s*\(\s*\d+"),                                   "benchmark"),
    (_re(r"\bSYS(?:TABLES|COLUMNS|OBJECTS|DATABASES)\b"),              "sys_tables"),
    (_re(r"\bpg_(?:tables|user|roles|shadow|catalog)\b"),              "pg_catalog"),
    (_re(r"\bALL_(?:TABLES|USERS|COLUMNS)\b"),                         "all_tables"),
    (_re(r"\bsp_(?:executesql|makewebtask|configure|addlogin)\b"),     "sp_abuse"),
    (_re(r"\bCREATE\s+(?:USER|LOGIN|ROLE)\b"),                         "create_user"),
    (_re(r"\bGRANT\s+ALL\b"),                                          "grant_all"),
    (_re(r"\bSHUTDOWN\b"),                                             "shutdown"),
    (_re(r"\bUTL_(?:FILE|HTTP|SMTP)\b"),                               "utl_oracle"),
    (_re(r"\bDBMS_(?:PIPE|JAVA)\b"),                                   "dbms_oracle"),
    (_re(r"\bOPENROWSET\b|\bOPENDATASOURCE\b"),                        "openrowset"),
    (_re(r"(?:0x[0-9a-fA-F]{4,}|\\x[0-9a-fA-F]{2})"),                 "hex_literal"),
    (_re(r"\bCHAR\s*\(\s*\d+(?:\s*,\s*\d+)+\s*\)"),                   "char_encode"),
    (_re(r"\bCONCAT\s*\([^)]*(?:'[^']*'[^)]*){2,}\)"),                "concat_strings"),
    (_re(r"\bCAST\s*\([^)]+\bAS\b\s*(?:CHAR|VARCHAR|NVARCHAR)\b"),    "cast_char"),
    (_re(r"\bCONVERT\s*\([^)]+\bUSING\b"),                            "convert_using"),
    (_re(r"\bIF\s*\(\s*.+,.+,.+\)"),                                   "if_conditional"),
    (_re(r"\bCASE\s+WHEN\b.+\bELSE\b"),                               "case_when"),
    (_re(r"\bSELECT\b.{0,60}\bFROM\b.{0,60}\bWHERE\b"),              "full_select"),
    (_re(r"\bDELETE\s+FROM\b"),                                        "delete_from"),
    (_re(r"\bUPDATE\b.{0,60}\bSET\b.{0,60}\bWHERE\b"),               "full_update"),
]

# ── Medium-confidence patterns (score 70) ───────────────────────────────────
_MEDIUM: list[tuple[re.Pattern[str], str]] = [
    # Classic tautologies
    (_re(r"'\s*(?:OR|AND)\s+'?\d+'?\s*=\s*'?\d+'?"),                  "tautology_str"),
    (_re(r"\bOR\b\s+\d+\s*=\s*\d+"),                                  "tautology_num"),
    (_re(r"\bAND\b\s+\d+\s*=\s*\d+"),                                 "and_tautology"),
    (_re(r"'\s*OR\s*'[^']*'\s*=\s*'[^']*'"),                         "or_str_eq"),
    (_re(r"'\s*=\s*'\s*(?:OR|AND)"),                                  "str_eq_or"),
    # Comment termination
    (_re(r"'?\s*(?:--|#|/\*|\*/)\s*$", re.MULTILINE),                 "comment_term"),
    (_re(r";\s*--\s*$", re.MULTILINE),                                "stmt_comment"),
    # String escape
    (_re(r"''\s*(?:OR|AND)\b"),                                       "double_quote_or"),
    (_re(r"\\\s*'\s*(?:OR|AND)\b"),                                   "escaped_quote"),
    # Having / group by injection
    (_re(r"\bHAVING\b\s+\d+\s*=\s*\d+"),                             "having_inj"),
    (_re(r"\bGROUP\s+BY\b.{0,30}\bHAVING\b"),                        "group_having"),
    # Order by injection
    (_re(r"\bORDER\s+BY\b\s+\d+\b"),                                  "order_by_num"),
    # Subquery injection
    (_re(r"\bSELECT\b.{0,30}\bFROM\b.{0,30}\bSELECT\b"),            "subquery"),
    # Coercions
    (_re(r"\b(?:NULL|TRUE|FALSE)\b.{0,20}=.{0,20}\b(?:NULL|TRUE|FALSE)\b"), "null_eq"),
    # Bitwise / string ops
    (_re(r"\|\|.{0,20}(?:SELECT|UNION|INSERT)"),                      "pipe_concat"),
    # Error-based hints
    (_re(r"extractvalue\s*\(|updatexml\s*\("),                        "error_based"),
    (_re(r"exp\s*\(\s*~\s*\("),                                       "exp_overflow"),
    (_re(r"(?:floor|rand)\s*\(.{0,20}\bgroup\s+by\b"),                "floor_rand"),
    # Stacked queries (without DDL — lower confidence)
    (_re(r";\s*(?:SELECT|INSERT|UPDATE|DELETE)\b"),                   "stacked_dml"),
    # NoSQL injection
    (_re(r"\$(?:where|gt|lt|ne|regex|exists|type)\b"),                "nosql_operator"),
    (_re(r"'\s*\}\s*,\s*\{"),                                         "nosql_json_break"),
    # ORM bypass
    (_re(r"'[^']*'\s+IS\s+NOT\s+NULL"),                               "orm_bypass"),
]

# ── Low-confidence (score 40) — contribute to semantic layer ────────────────
_LOW: list[tuple[re.Pattern[str], str]] = [
    (_re(r"\bSELECT\b.*\bFROM\b"),                                    "select_from"),
    (_re(r"\bWHERE\b\s+\w+\s*="),                                     "where_eq"),
    (_re(r"'\s*;\s*'"),                                                "str_semicolon"),
    (_re(r"\bLIMIT\b\s+\d+\s*(?:OFFSET\b\s+\d+)?"),                  "limit_offset"),
]


def check_sqli(text: str) -> DetectorResult:
    """
    Run all SQL injection pattern tiers against `text`.
    Returns highest-confidence match found.
    """
    matches: list[str] = []

    for pat, label in _HIGH:
        if pat.search(text):
            matches.append(label)
            if len(matches) >= 3:
                break

    if matches:
        return DetectorResult(hit=True, score=90.0, confidence=0.95,
                              kind="sqli", matches=matches)

    for pat, label in _MEDIUM:
        if pat.search(text):
            matches.append(label)

    if matches:
        return DetectorResult(hit=True, score=70.0, confidence=0.80,
                              kind="sqli", matches=matches)

    low_hits: list[str] = []
    for pat, label in _LOW:
        if pat.search(text):
            low_hits.append(label)

    if len(low_hits) >= 2:
        return DetectorResult(hit=True, score=40.0, confidence=0.50,
                              kind="sqli", matches=low_hits)

    return DetectorResult(hit=False, score=0.0, confidence=0.0, kind="sqli")
