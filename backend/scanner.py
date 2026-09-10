import os
import sys
import json
import subprocess  # nosec B404
from datetime import datetime

from backend.config import REPORTS_FOLDER, HISTORY_FILE


def scan_python_file(file_path: str):

    os.makedirs(REPORTS_FOLDER, exist_ok=True)

    filename = os.path.basename(file_path)
    file_name = os.path.splitext(filename)[0]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    txt_report = os.path.join(
        REPORTS_FOLDER,
        f"{file_name}_{timestamp}.txt"
    )

    json_report = os.path.join(
        REPORTS_FOLDER,
        f"{file_name}_{timestamp}.json"
    )

    # ==============================
    # Run Bandit TXT Report
    # ==============================

    with open(txt_report, "w", encoding="utf-8") as report:

        subprocess.run(  # nosec B603
            [
                sys.executable,
                "-m",
                "bandit",
                "-r",
                file_path
            ],
            stdout=report,
            stderr=report,
            text=True,
            check=False
        )

    # ==============================
    # Run Bandit JSON Report
    # ==============================

    subprocess.run(  # nosec B603
        [
            sys.executable,
            "-m",
            "bandit",
            "-r",
            file_path,
            "-f",
            "json",
            "-o",
            json_report
        ],
        check=False
    )

    # ==============================
    # Read JSON Report
    # ==============================

    issues = []

    try:

        if os.path.exists(json_report):

            with open(json_report, "r", encoding="utf-8") as file:

                report_data = json.load(file)

            issues = report_data.get("results", [])

    except Exception:

        issues = []

    # ==============================
    # Scan Result
    # ==============================

    status = "Safe"

    if len(issues) > 0:
        status = "Unsafe"

    result = {
        "filename": filename,
        "status": status,
        "issues_found": len(issues),
        "txt_report": txt_report,
        "json_report": json_report,
        "scan_time": timestamp
    }
    return result
