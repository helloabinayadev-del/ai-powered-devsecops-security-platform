import requests
import json

print("=== Testing Email API ===")

# Test connection endpoint
try:
    response = requests.get("http://127.0.0.1:8000/api/v1/email/test-connection")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")
