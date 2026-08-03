import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # First get token
        cmd_token = """curl -s -X POST 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=08a820fd-40d1-416b-83a0-8f12541908ea' \
  --data-urlencode 'client_secret=o4V3aC8mozAuPZnGjue7ye7iAmeyluWo' \
  --data-urlencode 'grant_type=client_credentials' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token','NO TOKEN')[:50]+'...')" """
        stdin, stdout, stderr = ssh.exec_command(cmd_token)
        token_preview = stdout.read().decode('utf-8', errors='replace').strip()
        print("Token preview:", token_preview)
        
        # Try sandbox payment endpoint - direct charges
        cmd = """TOKEN=$(curl -s -X POST 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=08a820fd-40d1-416b-83a0-8f12541908ea' \
  --data-urlencode 'client_secret=o4V3aC8mozAuPZnGjue7ye7iAmeyluWo' \
  --data-urlencode 'grant_type=client_credentials' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token obtained, testing endpoints..."

echo "=== developersandbox-api ==="
curl -s -X POST 'https://developersandbox-api.flutterwave.com/v4/payments' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":10,"currency":"NGN","reference":"JG-TEST-123","redirect_url":"https://joshuasgeneration.com","customer":{"email":"test@test.com","name":"Test User"}}' | head -c 500

echo ""
echo "=== api-sandbox ==="
curl -s -X POST 'https://api-sandbox.flutterwave.com/v4/payments' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":10,"currency":"NGN","reference":"JG-TEST-456","redirect_url":"https://joshuasgeneration.com","customer":{"email":"test@test.com","name":"Test User"}}' | head -c 500
"""
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        print("=== ENDPOINT TESTS ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
