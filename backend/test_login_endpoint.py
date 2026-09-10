import requests
import json

print("=== TESTING LOGIN ENDPOINT ===")

# Test with correct credentials
print("\n--- Test 1: Correct credentials (admin / Admin@123) ---")
login_data = {
    "username": "admin",
    "password": "Admin@123"
}

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=login_data,
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")

# Test with wrong credentials
print("\n--- Test 2: Wrong credentials (admin / wrongpassword) ---")
login_data_wrong = {
    "username": "admin",
    "password": "wrongpassword"
}

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=login_data_wrong,
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")

# Test with form-encoded data (like frontend)
print("\n--- Test 3: Form-encoded data (like frontend) ---")
from urllib.parse import urlencode
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

form_data = urlencode({
    "username": "admin",
    "password": "Admin@123"
})

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=form_data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")
