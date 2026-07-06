import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        cmd = """TOKEN=$(curl -s -X POST 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=08a820fd-40d1-416b-83a0-8f12541908ea' \
  --data-urlencode 'client_secret=o4V3aC8mozAuPZnGjue7ye7iAmeyluWo' \
  --data-urlencode 'grant_type=client_credentials' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

BODY='{"amount":10,"currency":"NGN","reference":"JG-TEST-root-123","redirect_url":"https://joshuasgeneration.com","customer":{"email":"test@test.com","name":"Test User"},"customizations":{"title":"Joshua Generation"}}'

echo "=== POST /payments ==="
curl -s -X POST 'https://developersandbox-api.flutterwave.com/payments' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BODY"

echo ""
echo "=== POST /checkout ==="
curl -s -X POST 'https://developersandbox-api.flutterwave.com/checkout' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BODY"

echo ""
echo "=== POST /payment-links ==="
curl -s -X POST 'https://developersandbox-api.flutterwave.com/payment-links' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BODY"
"""
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        print("=== ENDPOINT TESTS ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
