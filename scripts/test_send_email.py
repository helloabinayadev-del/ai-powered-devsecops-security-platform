import os
import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email import encoders

load_dotenv('c:/Users/Hello/ai-devsecops-platform/backend/.env')

print("=== Complete Email Send Test ===")

email_address = os.getenv("EMAIL_ADDRESS")
email_password = os.getenv("EMAIL_PASSWORD")
email_smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
email_smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "587"))

print(f"SMTP Server: {email_smtp_server}:{email_smtp_port}")
print(f"Sender: {email_address}")
print(f"Password Loaded: {'Yes' if email_password else 'No'}")

# Test recipient
receiver_email = "abinayaayyalusamy77@gmail.com"
print(f"Receiver: {receiver_email}")

# Test file
report_path = "c:/Users/Hello/ai-devsecops-platform/backend/reports/test_report.txt"
filename = "test_report.txt"

if not os.path.exists(report_path):
    print(f"Error: Report file not found at {report_path}")
    sys.exit(1)

print(f"Report path: {report_path}")
print(f"Report size: {os.path.getsize(report_path)} bytes")

try:
    # Create multipart message
    message = MIMEMultipart()
    message["Subject"] = "AI-Powered DevSecOps Security Report - TEST"
    message["From"] = email_address
    message["To"] = receiver_email
    
    # Email body
    body = f"""
Hello,

This is a TEST email from the AI-Powered DevSecOps Security Platform.

Test Report: {filename}

Please review the report.

Regards,
AI-Powered DevSecOps Security Platform
"""
    message.attach(MIMEText(body, "plain"))
    
    # Attach file
    print("Attaching report file...")
    with open(report_path, "rb") as report:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(report.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f"attachment; filename= {filename}"
        )
        message.attach(part)
    
    print("File attached successfully")
    
    # Send email
    print(f"Connecting to SMTP server {email_smtp_server}:{email_smtp_port}")
    with smtplib.SMTP(email_smtp_server, email_smtp_port, timeout=30) as smtp:
        print("SMTP connection established")
        print("Starting TLS...")
        smtp.starttls()
        print("TLS started successfully")
        print(f"Authenticating as {email_address}")
        smtp.login(email_address, email_password)
        print("Authentication successful")
        print(f"Sending email to {receiver_email}")
        smtp.send_message(message)
        print("Email sent successfully via SMTP")
    
    print("\n=== Email Send Test: SUCCESS ===")
    print(f"Email sent to {receiver_email}")
    print(f"Subject: AI-Powered DevSecOps Security Report - TEST")
    print(f"Attachment: {filename}")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n=== SMTP Authentication Failed ===")
    print(f"Error: {str(e)}")
    print("Possible causes: Wrong password, need App Password, 2FA enabled")
except smtplib.SMTPException as e:
    print(f"\n=== SMTP Error ===")
    print(f"Error: {str(e)}")
except Exception as e:
    print(f"\n=== Email Send Failed ===")
    print(f"Error: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
