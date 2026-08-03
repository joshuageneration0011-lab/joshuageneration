import requests

def main():
    login_url = "https://joshuasgeneration.com/api/auth/login"
    settings_url = "https://joshuasgeneration.com/api/settings"
    
    payload = {
        "email": "admin@joshuagen.org",
        "password": "admin123"
    }
    
    session = requests.Session()
    try:
        # Login
        r = session.post(login_url, json=payload, verify=True, timeout=10)
        print("Login status code:", r.status_code)
        print("Login response:", r.text)
        if r.status_code != 200:
            return
            
        data = r.json()
        token = data.get("token")
        print("Token received:", token is not None)
        
        # Get settings
        headers = {
            "Authorization": f"Bearer {token}"
        }
        r2 = session.get(settings_url, headers=headers, verify=True, timeout=10)
        print("GET settings status code:", r2.status_code)
        print("GET settings response:", r2.text)
        
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
