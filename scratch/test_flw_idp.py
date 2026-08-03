import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Test the Flutterwave IdP token endpoint directly
        cmd = """curl -s -X POST 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'client_id=08a820fd-40d1-416b-83a0-8f12541908ea' \
  --data-urlencode 'client_secret=o4V3aC8mozAuPZnGjue7ye7iAmeyluWo' \
  --data-urlencode 'grant_type=client_credentials'"""
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== FLUTTERWAVE IDP RESPONSE ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
        # Check latest error log
        cmd2 = "tail -5 /root/.pm2/logs/joshuagen-backend-error.log"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("\n=== LATEST ERROR LOG ===")
        print(stdout2.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
