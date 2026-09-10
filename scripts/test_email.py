import os
import sys
sys.path.insert(0, 'c:/Users/Hello/ai-devsecops-platform')

from dotenv import load_dotenv
load_dotenv('c:/Users/Hello/ai-devsecops-platform/backend/.env')

print("=== Email Configuration Test ===")
print(f"EMAIL_ADDRESS: {os.getenv('EMAIL_ADDRESS')}")
print(f"EMAIL_PASSWORD Loaded: {'Yes' if os.getenv('EMAIL_PASSWORD') else 'No'}")
print(f"EMAIL_SMTP_SERVER: {os.getenv('EMAIL_SMTP_SERVER')}")
print(f"EMAIL_SMTP_PORT: {os.getenv('EMAIL_SMTP_PORT')}")

import smtplib

print("\n=== Testing SMTP Connection ===")
try:
    email_smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    email_smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "587"))
    email_address = os.getenv("EMAIL_ADDRESS")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    print(f"Connecting to {email_smtp_server}:{email_smtp_port}")
    
    with smtplib.SMTP(email_smtp_server, email_smtp_port, timeout=10) as server:
        print("SMTP connection established")
        print("Starting TLS encryption")
        server.starttls()
        print("TLS started successfully")
        print(f"Authenticating as {email_address}")
        server.login(email_address, email_password)
        print("Authentication successful")
    
    print("\n=== SMTP Connection Test: SUCCESS ===")
except smtplib.SMTPAuthenticationError as e:
    print(f"\n=== SMTP Authentication Failed ===")
    print(f"Error: {str(e)}")
    print("Possible causes: Wrong password, need App Password, 2FA enabled")
except Exception as e:
    print(f"\n=== SMTP Connection Failed ===")
    print(f"Error: {str(e)}")
    print(f"Error type: {type(e).__name__}")
