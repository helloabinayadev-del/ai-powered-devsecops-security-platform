import requests
import json

print("=== Testing Email Send API ===")

# First, login to get token
login_data = {
    "username": "admin",
    "password": "Admin@123"
}

try:
    login_response = requests.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=login_data
    )
    print(f"Login Status Code: {login_response.status_code}")
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        print(f"Access Token: {access_token[:50]}...")
        
        # Test send email with token
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        send_data = {
            "receiver_email": "abinayaayyalusamy77@gmail.com",
            "filename": "test_report.txt"
        }
        
        send_response = requests.post(
            "http://127.0.0.1:8000/api/v1/email/send",
            params=send_data,
            headers=headers
        )
        print(f"\nSend Email Status Code: {send_response.status_code}")
        print(f"Response: {json.dumps(send_response.json(), indent=2)}")
    else:
        print(f"Login failed: {login_response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
