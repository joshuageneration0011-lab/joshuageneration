import urllib.request
import urllib.error
import json

def main():
    url = "https://joshuasgeneration.com/api/initiate-payment"
    payload = {
        "amount": 1000,
        "email": "test@test.com",
        "name": "Test User",
        "cause": "prophetic",
        "frequency": "one-time"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            print("=== STATUS CODE ===")
            print(response.getcode())
            print("=== RESPONSE BODY ===")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("=== HTTP ERROR ===")
        print(e.code)
        print(e.read().decode('utf-8'))
    except Exception as e:
        print("=== ERROR ===")
        print(e)

if __name__ == "__main__":
    main()
