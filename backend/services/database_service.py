from sqlalchemy.orm import Session
from backend.database.models import ScanHistory


def save_scan(
    db: Session,
    filename: str,
    report_name: str,
    vulnerabilities: int,
    status: str
):
    scan = ScanHistory(
        filename=filename,
        report_name=report_name,
        vulnerabilities=vulnerabilities,
        status=status
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return scan
