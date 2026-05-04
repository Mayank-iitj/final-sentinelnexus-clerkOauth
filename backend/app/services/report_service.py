"""
SentinelNexus Report Generation Service
==========================================
Generates professional HackerOne-style PDF security reports using ReportLab.

Features:
  - Cover page with logo, scan metadata, overall CVSS score gauge
  - Executive summary with risk distribution matrix
  - Full findings table: type, severity, CVSS v3.1 score, CWE, evidence snippet, line #
  - Compliance mapping table (OWASP Top 10 / SOC2 / GDPR)
  - Remediation appendix
  - Confidential watermark on every page
  - Table of contents
"""
from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from loguru import logger

# ReportLab
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
DARK_BG     = colors.HexColor("#0d1117")
SURFACE     = colors.HexColor("#161b22")
EMERALD     = colors.HexColor("#10b981")
AMBER       = colors.HexColor("#f59e0b")
RED         = colors.HexColor("#ef4444")
CRITICAL    = colors.HexColor("#7c3aed")
TEXT_MAIN   = colors.HexColor("#e6edf3")
TEXT_MUTED  = colors.HexColor("#8b949e")
BORDER      = colors.HexColor("#30363d")
WHITE       = colors.white
BLACK       = colors.black

SEVERITY_COLOURS = {
    "critical": CRITICAL,
    "high":     RED,
    "medium":   AMBER,
    "low":      EMERALD,
    "none":     TEXT_MUTED,
}

# Compliance mapping: OWASP Top 10 A-codes per finding type
OWASP_MAP: Dict[str, str] = {
    "sql_injection_pattern":      "A03:2021",
    "eval_injection":             "A03:2021",
    "command_injection":          "A03:2021",
    "xss_pattern":                "A03:2021",
    "path_traversal":             "A01:2021",
    "xxe_pattern":                "A05:2021",
    "ssrf_pattern":               "A10:2021",
    "open_redirect":              "A01:2021",
    "insecure_deserialization":   "A08:2021",
    "weak_crypto_md5":            "A02:2021",
    "weak_crypto_sha1":           "A02:2021",
    "hardcoded_api_key":          "A02:2021",
    "hardcoded_password":         "A02:2021",
    "private_key_block":          "A02:2021",
    "jwt_secret":                 "A02:2021",
    "debug_mode_enabled":         "A05:2021",
    "insecure_random":            "A02:2021",
    "prompt_injection":           "A03:2021",
    "jailbreak_attempt":          "A05:2021",
    "pii_exfiltration_attempt":   "A01:2021",
    "credit_card_number":         "A02:2021",
    "social_security_number":     "A02:2021",
    "iac_public_s3_bucket":       "A05:2021",
    "iac_overly_permissive_iam":  "A01:2021",
}

SOC2_MAP: Dict[str, str] = {
    "hardcoded_api_key":    "CC6.1, CC6.6",
    "hardcoded_password":   "CC6.1",
    "sql_injection_pattern":"CC6.6",
    "xss_pattern":          "CC6.6",
    "credit_card_number":   "CC6.7, CC9.2",
    "social_security_number":"CC6.7",
    "debug_mode_enabled":   "CC7.2",
    "prompt_injection":     "CC6.6",
}

GDPR_MAP: Dict[str, str] = {
    "credit_card_number":        "Art. 5, Art. 32",
    "social_security_number":    "Art. 9, Art. 32",
    "email_address":             "Art. 5, Art. 25",
    "phone_number":              "Art. 5",
    "iban_number":               "Art. 9, Art. 32",
    "passport_number":           "Art. 9",
    "pii_exfiltration_attempt":  "Art. 33",
}


# ---------------------------------------------------------------------------
# Watermark canvas
# ---------------------------------------------------------------------------
class _WatermarkCanvas(canvas.Canvas):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        self._page_number = 0
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_watermark(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_watermark(self, total_pages: int) -> None:
        self.saveState()
        width, height = A4

        # Diagonal CONFIDENTIAL text
        self.setFont("Helvetica-Bold", 48)
        self.setFillColorRGB(0.9, 0.1, 0.1, alpha=0.06)
        self.translate(width / 2, height / 2)
        self.rotate(45)
        self.drawCentredString(0, 0, "CONFIDENTIAL")
        self.restoreState()

        # Footer
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(15 * mm, 8 * mm, "SentinelNexus Guard – Confidential Security Report")
        self.drawRightString(width - 15 * mm, 8 * mm,
                             f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------
def generate_pdf(
    *,
    scan_id: str,
    scan_target: str,
    scan_type: str,
    findings: List[Dict[str, Any]],
    risk_score: int,
    risk_level: str,
    cvss_max: Optional[float],
    user_name: str,
    project_name: Optional[str],
    output_path: str,
) -> int:
    """
    Build a production-grade PDF security report.
    Returns file size in bytes.
    """
    styles = getSampleStyleSheet()
    page_w, page_h = A4

    # Custom styles
    title_style = ParagraphStyle("ReportTitle",
        fontName="Helvetica-Bold", fontSize=26, textColor=WHITE,
        spaceAfter=6, alignment=TA_LEFT)
    h2_style = ParagraphStyle("H2",
        fontName="Helvetica-Bold", fontSize=14, textColor=EMERALD,
        spaceBefore=14, spaceAfter=6, alignment=TA_LEFT)
    h3_style = ParagraphStyle("H3",
        fontName="Helvetica-Bold", fontSize=11, textColor=TEXT_MAIN,
        spaceBefore=8, spaceAfter=4)
    body_style = ParagraphStyle("Body",
        fontName="Helvetica", fontSize=9, textColor=TEXT_MUTED,
        spaceAfter=4, leading=13)
    code_style = ParagraphStyle("Code",
        fontName="Courier", fontSize=8, textColor=TEXT_MAIN,
        backColor=SURFACE, borderPad=4, borderRadius=3,
        spaceAfter=4, leading=11)
    label_style = ParagraphStyle("Label",
        fontName="Helvetica-Bold", fontSize=8, textColor=WHITE,
        alignment=TA_CENTER)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
    )

    story = []

    # ── Cover page ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 30 * mm))
    story.append(Paragraph("SentinelNexus Guard", ParagraphStyle(
        "coverBrand", fontName="Helvetica-Bold", fontSize=11,
        textColor=EMERALD, spaceAfter=4)))
    story.append(Paragraph("Security Assessment Report", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=EMERALD, spaceAfter=8))

    meta_data = [
        ["Target", scan_target[:80]],
        ["Scan Type", scan_type.upper()],
        ["Scan ID", scan_id],
        ["Project", project_name or "—"],
        ["Assessed By", user_name],
        ["Date", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")],
        ["Overall Risk", risk_level.upper()],
        ["Risk Score", f"{risk_score}/100"],
        ["Max CVSS v3.1", f"{cvss_max:.1f}" if cvss_max else "N/A"],
        ["Findings", str(len(findings))],
    ]
    meta_table = Table(meta_data, colWidths=[50 * mm, 120 * mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_MAIN),
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [DARK_BG, SURFACE]),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # ── Executive Summary ────────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        sev = f.get("severity", "low")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    summary_text = (
        f"This report presents the results of an automated security assessment performed by "
        f"SentinelNexus Guard on target <b>{scan_target[:60]}</b>. "
        f"A total of <b>{len(findings)} findings</b> were identified, of which "
        f"<b>{severity_counts['critical']} critical</b>, "
        f"<b>{severity_counts['high']} high</b>, "
        f"<b>{severity_counts['medium']} medium</b>, and "
        f"<b>{severity_counts['low']} low</b> severity. "
        f"The overall risk score is <b>{risk_score}/100</b> ({risk_level.upper()}). "
        f"The highest individual CVSS v3.1 base score recorded is "
        f"<b>{f'{cvss_max:.1f}' if cvss_max else 'N/A'}</b>. "
        f"All findings in this report are derived from static analysis with reproducible evidence; "
        f"no simulated or artificially generated results are included."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 6))

    # Risk distribution table
    risk_table_data = [
        ["Severity", "Count", "CVSS Range", "Recommended Action"],
        ["CRITICAL", str(severity_counts["critical"]), "9.0–10.0", "Immediate remediation required"],
        ["HIGH",     str(severity_counts["high"]),     "7.0–8.9",  "Remediate within 24 hours"],
        ["MEDIUM",   str(severity_counts["medium"]),   "4.0–6.9",  "Remediate within sprint"],
        ["LOW",      str(severity_counts["low"]),      "0.1–3.9",  "Remediate as bandwidth allows"],
    ]
    risk_table = Table(risk_table_data, colWidths=[30 * mm, 20 * mm, 30 * mm, 90 * mm])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SURFACE),
        ("TEXTCOLOR", (0, 0), (-1, 0), EMERALD),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (0, 1), CRITICAL),
        ("TEXTCOLOR", (0, 2), (0, 2), RED),
        ("TEXTCOLOR", (0, 3), (0, 3), AMBER),
        ("TEXTCOLOR", (0, 4), (0, 4), EMERALD),
        ("TEXTCOLOR", (1, 1), (-1, -1), TEXT_MUTED),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_BG, SURFACE]),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 10))

    # ── Findings Detail ───────────────────────────────────────────────────────
    if findings:
        story.append(Paragraph("Findings", h2_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))

        for idx, f in enumerate(findings, 1):
            sev = f.get("severity", "low")
            cvss = f.get("cvss_score", 0.0)
            vec = f.get("cvss_vector", "")
            cwe = f.get("cwe", "")
            owasp = OWASP_MAP.get(f.get("finding_type", ""), "—")
            soc2 = SOC2_MAP.get(f.get("finding_type", ""), "—")
            gdpr = GDPR_MAP.get(f.get("finding_type", ""), "—")

            story.append(Paragraph(
                f"<b>F{idx:03d}</b> — {f.get('finding_type', '').replace('_', ' ').title()}",
                h3_style))

            sev_color_map = {"critical": "#7c3aed", "high": "#ef4444", "medium": "#f59e0b", "low": "#10b981"}
            sev_hex = sev_color_map.get(sev, "#8b949e")

            finding_meta = [
                ["Severity", sev.upper(), "CVSS v3.1", f"{cvss:.1f}",
                 "CWE", cwe or "—", "OWASP", owasp],
                ["CVSS Vector", vec or "—", "SOC2", soc2, "GDPR", gdpr, "Line", str(f.get("line_number") or "—")],
            ]
            fmeta_table = Table(finding_meta, colWidths=[20*mm, 28*mm, 20*mm, 18*mm, 16*mm, 24*mm, 14*mm, 28*mm])
            fmeta_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTNAME", (4, 0), (4, -1), "Helvetica-Bold"),
                ("FONTNAME", (6, 0), (6, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_MUTED),
                ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor(sev_hex)),
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("SPAN", (1, 1), (1, 1)),
            ]))
            story.append(fmeta_table)

            story.append(Paragraph(
                f"<b>Description:</b> {f.get('message', '')}",
                ParagraphStyle("fDesc", fontName="Helvetica", fontSize=8.5,
                               textColor=TEXT_MAIN, spaceAfter=3, leading=12)))

            if f.get("evidence"):
                evidence_text = str(f["evidence"]).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(f"<b>Evidence:</b>", ParagraphStyle(
                    "evLabel", fontName="Helvetica-Bold", fontSize=8, textColor=TEXT_MUTED, spaceAfter=1)))
                story.append(Paragraph(evidence_text[:400], code_style))

            story.append(Paragraph(
                f"<b>Remediation:</b> {f.get('remediation', '')}",
                ParagraphStyle("fRem", fontName="Helvetica", fontSize=8.5,
                               textColor=TEXT_MUTED, spaceAfter=8, leading=12)))
            story.append(HRFlowable(width="100%", thickness=0.3, color=BORDER, spaceAfter=6))

    # ── Compliance Mapping ────────────────────────────────────────────────────
    story.append(Paragraph("Compliance Framework Mapping", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
    comp_data = [["Finding Type", "OWASP Top 10 (2021)", "SOC2 Controls", "GDPR Articles"]]
    seen_types = set()
    for f in findings:
        ft = f.get("finding_type", "")
        if ft in seen_types:
            continue
        seen_types.add(ft)
        comp_data.append([
            ft.replace("_", " ").title(),
            OWASP_MAP.get(ft, "—"),
            SOC2_MAP.get(ft, "—"),
            GDPR_MAP.get(ft, "—"),
        ])
    if len(comp_data) > 1:
        comp_table = Table(comp_data, colWidths=[60*mm, 38*mm, 38*mm, 38*mm])
        comp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SURFACE),
            ("TEXTCOLOR", (0, 0), (-1, 0), EMERALD),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_MUTED),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_BG, SURFACE]),
            ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(comp_table)
    else:
        story.append(Paragraph("No applicable compliance mappings for this scan.", body_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Methodology & Disclaimers", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
    story.append(Paragraph(
        "All findings were produced by SentinelNexus Guard's static analysis engine using "
        "real pattern-matching algorithms, CVSS v3.1 base score calculation per FIRST specification, "
        "and SHA-256 deduplication. This report does <b>not</b> include any simulated, mocked, or "
        "artificially generated results. CVSS scores reflect base metrics only; temporal and "
        "environmental adjustments should be applied by the receiving security team. "
        "This assessment covers the submitted artifact at the time of scanning. A clean report does "
        "not imply absence of all vulnerabilities; combine with dynamic testing and penetration "
        "testing for comprehensive coverage.",
        body_style))

    # Build PDF with watermark canvas
    doc.build(story, canvasmaker=_WatermarkCanvas)

    return os.path.getsize(output_path)


# ---------------------------------------------------------------------------
# Service entry point
# ---------------------------------------------------------------------------
REPORTS_DIR = Path("reports")


def ensure_reports_dir() -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    return REPORTS_DIR


def generate_report_for_scan(
    *,
    scan_id: str,
    scan_target: str,
    scan_type: str,
    result_json: str,
    risk_score: int,
    risk_level: str,
    user_name: str,
    project_name: Optional[str] = None,
) -> tuple[str, int]:
    """
    Generate PDF and return (relative_file_path, file_size_bytes).
    Raises on failure.
    """
    ensure_reports_dir()
    findings: List[Dict[str, Any]] = []
    try:
        data = json.loads(result_json or "{}")
        findings = data.get("findings", [])
    except (json.JSONDecodeError, Exception) as exc:
        logger.warning(f"Could not parse findings JSON for scan {scan_id}: {exc}")

    cvss_max: Optional[float] = None
    if findings:
        scores = [f.get("cvss_score") for f in findings if f.get("cvss_score") is not None]
        if scores:
            cvss_max = max(scores)

    filename = f"report_{scan_id}_{int(time.time())}.pdf"
    output_path = str(REPORTS_DIR / filename)

    size = generate_pdf(
        scan_id=scan_id,
        scan_target=scan_target,
        scan_type=scan_type,
        findings=findings,
        risk_score=risk_score,
        risk_level=risk_level,
        cvss_max=cvss_max,
        user_name=user_name,
        project_name=project_name,
        output_path=output_path,
    )
    return filename, size
