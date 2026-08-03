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

BODY='{"amount":10,"currency":"NGN","reference":"JG-TEST-789","redirect_url":"https://joshuasgeneration.com","customer":{"email":"test@test.com","name":"Test User"},"customizations":{"title":"Joshua Generation"}}'

echo "=== developersandbox-api /orchestration/direct-charges ==="
curl -s -X POST 'https://developersandbox-api.flutterwave.com/orchestration/direct-charges' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Trace-Id: trace-001" \
  -H "X-Idempotency-Key: idem-001" \
  -d "$BODY" | head -c 800

echo ""
echo "=== v3 inline payment link (sandbox) ==="
curl -s -X POST 'https://api.flutterwave.com/v3/payments' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BODY" | head -c 800
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
