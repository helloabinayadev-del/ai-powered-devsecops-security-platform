from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import time
import json
from datetime import datetime

from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter

from backend.auth.roles import admin_required
from backend.auth.dependencies import get_current_user
from backend.config import REPORTS_FOLDER, UPLOAD_FOLDER
from backend.database.database import get_db
from backend.database.models import ScanHistory, AIAnalysis, RiskHistory
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"]
)


def _report_path(filename: str) -> str:
    """Return a report path only for a single JSON report filename."""
    if not filename or os.path.basename(filename) != filename or not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Invalid report filename")
    return os.path.join(REPORTS_FOLDER, filename)


def _get_report_basename(filename: str) -> str:
    if not filename or os.path.basename(filename) != filename:
        raise HTTPException(status_code=400, detail="Invalid report filename")
    base = filename
    for ext in [".json", ".txt", ".pdf", ".html"]:
        if base.endswith(ext):
            base = base[:-len(ext)]
            break
    if not base or os.path.basename(base) != base:
        raise HTTPException(status_code=400, detail="Invalid report filename")
    return base


def _verify_report_ownership(db: Session, base_name: str, user: dict):
    scan = db.query(ScanHistory).filter(
        (ScanHistory.report_name == base_name + ".json") |
        (ScanHistory.report_name == base_name)
    ).first()
    if not scan or (scan.user_id != user["id"] and user["role"].upper() != "ADMIN"):
        raise HTTPException(status_code=404, detail="Report not found")
    return scan


def on_page(canvas, doc):
    """Footer with page numbers"""
    canvas.saveState()
    footer_text = f"AI-Powered DevSecOps Security Platform - Security Report - Page {canvas.getPageNumber()}"
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.grey)
    canvas.drawString(inch, 0.5 * inch, footer_text)
    canvas.restoreState()


# ==========================================
# List Reports
# ==========================================

@router.get("/")
def list_reports(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    scans = db.query(ScanHistory).filter(
        ScanHistory.user_id == user["id"],
        ScanHistory.report_name.isnot(None)
    ).order_by(ScanHistory.id.desc()).all()

    reports = [
        scan.report_name for scan in scans
        if scan.report_name and os.path.exists(os.path.join(REPORTS_FOLDER, scan.report_name))
    ]

    return {
        "logged_in_user": user["sub"],
        "role": user["role"],
        "total_reports": len(reports),
        "reports": reports
    }


# ==========================================
# View JSON Report
# ==========================================

@router.get("/view/{filename}")
def view_report(
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    base_name = _get_report_basename(filename)
    _verify_report_ownership(db, base_name, user)
    file_path = os.path.join(REPORTS_FOLDER, base_name + ".json")

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return FileResponse(
        file_path,
        media_type="application/json"
    )


# ==========================================
# Download JSON
# ==========================================

@router.get("/json/{filename}")
def download_json(
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    base_name = _get_report_basename(filename)
    _verify_report_ownership(db, base_name, user)
    json_name = base_name + ".json"
    file_path = os.path.join(REPORTS_FOLDER, json_name)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return FileResponse(
        path=file_path,
        filename=json_name,
        media_type="application/json"
    )


# ==========================================
# Download TXT
# ==========================================

@router.get("/text/{filename}")
def download_text(
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    base_name = _get_report_basename(filename)
    _verify_report_ownership(db, base_name, user)
    txt_name = base_name + ".txt"
    txt_path = os.path.join(REPORTS_FOLDER, txt_name)
    json_path = os.path.join(REPORTS_FOLDER, base_name + ".json")

    if os.path.isfile(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                scan_data = json.load(f)

            ai_report = scan_data.get("ai_report")
            if os.path.isfile(txt_path) and not isinstance(ai_report, dict):
                return FileResponse(
                    path=txt_path,
                    filename=txt_name,
                    media_type="text/plain; charset=utf-8",
                )

            lines = [
                "=" * 60,
                "AI-POWERED DEVSECOPS SECURITY PLATFORM - SECURITY REPORT",
                "=" * 60,
                f"Filename: {ai_report.get('filename') if isinstance(ai_report, dict) else scan_data.get('target', scan_data.get('filename', base_name))}",
                f"Scan Time: {ai_report.get('generated_at') if isinstance(ai_report, dict) else scan_data.get('scan_time', 'N/A')}",
                f"Risk Level: {(ai_report.get('security_score', {}).get('risk_level') if isinstance(ai_report, dict) else scan_data.get('status', 'N/A'))}",
                f"Issues Found: {len(scan_data.get('results', []))}",
                "=" * 60,
                "\nAI EXECUTIVE SUMMARY:\n",
                ai_report.get("executive_summary", "AI analysis is not available.") if isinstance(ai_report, dict) else "AI analysis is not available.",
                "\nFINDINGS DETAILS:\n",
            ]
            for idx, issue in enumerate(scan_data.get("results", []), 1):
                lines.append(f"[{idx}] {issue.get('issue_text', 'Vulnerability')}")
                lines.append(f"    Severity: {issue.get('issue_severity', 'N/A')}")
                lines.append(f"    Confidence: {issue.get('issue_confidence', 'N/A')}")
                lines.append(f"    Location: Line {issue.get('line_number', 'N/A')}")
                lines.append(f"    Code Snippet:\n    {issue.get('code', '').strip()}")
                lines.append("-" * 40)

            with open(txt_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))

            return FileResponse(
                path=txt_path,
                filename=txt_name,
                media_type="text/plain; charset=utf-8"
            )
        except Exception:
            pass

    raise HTTPException(
        status_code=404,
        detail="TXT Report not found"
    )


# ==========================================
# Download PDF
# ==========================================

@router.get("/pdf/{filename}")
def download_pdf(
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    base_name = _get_report_basename(filename)
    _verify_report_ownership(db, base_name, user)
    json_path = os.path.join(REPORTS_FOLDER, base_name + ".json")
    pdf_name = base_name + ".pdf"
    pdf_path = os.path.join(REPORTS_FOLDER, pdf_name)

    if not os.path.isfile(json_path) and not os.path.isfile(pdf_path):
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    # If the JSON source was removed after a previous PDF generation, return
    # the existing document instead of replacing it with an empty one.
    if not os.path.isfile(json_path):
        return FileResponse(
            path=pdf_path,
            filename=pdf_name,
            media_type="application/pdf",
        )

    # Load scan data from JSON report
    try:
        with open(json_path, 'r', encoding="utf-8") as f:
            scan_data = json.load(f)
    except Exception:
        scan_data = {}

    # Create professional PDF
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=1,
        fontName='Helvetica-Bold'
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )

    # 1. Cover Page
    elements.append(Paragraph("AI-Powered DevSecOps Security Platform", title_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Security Assessment Report", styles['Heading2']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Report File: {base_name}", styles['Normal']))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
    elements.append(Paragraph(f"Generated By: {user['sub']}", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Confidential Document", styles['Normal']))
    elements.append(Paragraph("For internal use only", styles['Normal']))
    elements.append(PageBreak())

    ai_report = scan_data.get("ai_report", {})
    if not isinstance(ai_report, dict):
        ai_report = {}

    # 2. Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    summary_text = ai_report.get("executive_summary") or """
    This security assessment report provides a comprehensive analysis of the scanned Python codebase.
    The AI-Powered DevSecOps Security Platform utilizes Bandit static analysis combined with AI-powered vulnerability
    analysis to identify security risks, provide remediation guidance, and calculate an overall
    security score for the application.
    """
    elements.append(Paragraph(summary_text, styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))

    # 3. Security Score
    elements.append(Paragraph("Security Score", heading_style))
    risk_level = ai_report.get("security_score", {}).get("risk_level", scan_data.get('risk_level', 'Unknown'))
    results = scan_data.get('results', [])
    issues = len(results)
    security_score = ai_report.get("security_score", {}).get("score", 100 if issues == 0 else max(0, 100 - (issues * 5)))

    score_data = [
        ['Risk Level', str(risk_level)],
        ['Security Score', f"{security_score}/100"],
        ['Total Issues Found', str(issues)],
        ['Scan Status', str(scan_data.get('status', 'Completed'))]
    ]

    score_table = Table(score_data, colWidths=[2*inch, 2*inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 0.3*inch))

    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)

    return FileResponse(
        path=pdf_path,
        filename=pdf_name,
        media_type="application/pdf"
    )


# ==========================================
# Delete Report
# ==========================================

@router.delete("/{filename}")
def delete_report(
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    base_name = _get_report_basename(filename)
    _verify_report_ownership(db, base_name, user)

    # Delete report files (.json, .txt, .pdf, .html)
    deleted_any = False
    for ext in ['.json', '.txt', '.pdf', '.html']:
        file_path = os.path.join(REPORTS_FOLDER, base_name + ext)
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
                deleted_any = True
            except Exception as e:
                print(f"Error removing {file_path}: {e}")

    # Search scan history record
    scans = db.query(ScanHistory).filter(
        (ScanHistory.report_name == filename) |
        (ScanHistory.report_name == base_name + ".json")
    ).all()

    for scan in scans:
        uploaded_file_path = os.path.join(UPLOAD_FOLDER, scan.filename)
        if os.path.exists(uploaded_file_path):
            try:
                os.remove(uploaded_file_path)
            except Exception as e:
                print(f"Error removing upload file {uploaded_file_path}: {e}")

        try:
            db.query(AIAnalysis).filter(AIAnalysis.scan_id == scan.id).delete()
            db.query(RiskHistory).filter(RiskHistory.scan_id == scan.id).delete()
        except Exception as e:
            print(f"Error deleting child records: {e}")

        db.delete(scan)

    db.commit()

    return {
        "success": True,
        "message": "Report and associated records deleted successfully",
        "filename": filename
    }


# ==========================================
# Cleanup Reports
# ==========================================

@router.post("/cleanup")
def cleanup_reports(
    days: int = 30,
    user=Depends(admin_required)
):
    if not 1 <= days <= 3650:
        raise HTTPException(status_code=422, detail="days must be between 1 and 3650")

    if not os.path.exists(REPORTS_FOLDER):
        return {
            "success": True,
            "deleted_files": 0
        }

    deleted = 0
    current_time = time.time()

    for file in os.listdir(REPORTS_FOLDER):
        file_path = os.path.join(REPORTS_FOLDER, file)
        if not os.path.isfile(file_path):
            continue

        age = current_time - os.path.getmtime(file_path)
        if age > days * 86400:
            os.remove(file_path)
            deleted += 1

    return {
        "success": True,
        "days": days,
        "deleted_files": deleted
    }
