import requests
import json

print("=" * 80)
print("FINAL LOGIN VERIFICATION TEST")
print("=" * 80)

# Test 1: Correct credentials
print("\n[TEST 1] Correct credentials (admin / Admin@123)")
print("-" * 80)
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
    if response.status_code == 200:
        print("✅ LOGIN SUCCESSFUL")
        result = response.json()
        print(f"Access Token: {result['access_token'][:50]}...")
        print(f"Token Type: {result['token_type']}")
        
        # Test protected route with token
        print("\n[TEST 2] Protected route with token")
        print("-" * 80)
        headers = {
            "Authorization": f"Bearer {result['access_token']}"
        }
        protected_response = requests.get(
            "http://127.0.0.1:8000/api/v1/files",
            headers=headers,
            timeout=10
        )
        print(f"Protected Route Status: {protected_response.status_code}")
        if protected_response.status_code == 200:
            print("✅ PROTECTED ROUTE ACCESS SUCCESSFUL")
        else:
            print(f"❌ PROTECTED ROUTE FAILED: {protected_response.text}")
    else:
        print(f"❌ LOGIN FAILED")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

# Test 3: Wrong credentials
print("\n[TEST 3] Wrong credentials (admin / wrongpassword)")
print("-" * 80)
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
    if response.status_code == 401:
        print("✅ CORRECTLY REJECTED WRONG CREDENTIALS")
        print(f"Response: {response.json()['detail']}")
    else:
        print(f"❌ UNEXPECTED RESPONSE: {response.text}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

# Test 4: Non-existent user
print("\n[TEST 4] Non-existent user (nonexistent / Admin@123)")
print("-" * 80)
login_data_nonexistent = {
    "username": "nonexistent",
    "password": "Admin@123"
}

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=login_data_nonexistent,
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 401:
        print("✅ CORRECTLY REJECTED NON-EXISTENT USER")
        print(f"Response: {response.json()['detail']}")
    else:
        print(f"❌ UNEXPECTED RESPONSE: {response.text}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n" + "=" * 80)
print("FINAL VERIFICATION COMPLETE")
print("=" * 80)
