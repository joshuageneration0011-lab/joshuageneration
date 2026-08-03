import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Try v3 with the client secret as the bearer token (some Flutterwave sandbox setups use this)
        cmd = """curl -s -X POST 'https://api.flutterwave.com/v3/payments' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer FLWSECK_TEST-o4V3aC8mozAuPZnGjue7ye7iAmeyluWo-X" \
  -d '{
    "tx_ref": "JG-TEST-001",
    "amount": 10,
    "currency": "NGN",
    "redirect_url": "https://joshuasgeneration.com",
    "customer": {
      "email": "test@test.com",
      "name": "Test User"
    },
    "customizations": {
      "title": "Joshua Generation",
      "description": "Test Donation"
    }
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2))"
"""
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        print("=== V3 with FLWSECK_TEST prefix ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
