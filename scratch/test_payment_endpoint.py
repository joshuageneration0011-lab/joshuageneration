import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Trigger a test call to initiate-payment and check logs
        cmd = """curl -s -X POST https://joshuasgeneration.com/api/initiate-payment \
  -H 'Content-Type: application/json' \
  -d '{"cause":"Prophetic Offering","amount":10,"name":"Test User","email":"test@test.com","frequency":"one-time"}'"""
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== CURL RESPONSE ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
        import time
        time.sleep(2)
        
        # Get latest error logs
        cmd2 = "tail -50 /root/.pm2/logs/joshuagen-backend-error.log"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("=== LATEST ERROR LOGS ===")
        print(stdout2.read().decode('utf-8', errors='replace'))
        
        # Also check out logs
        cmd3 = "tail -20 /root/.pm2/logs/joshuagen-backend-out.log"
        stdin3, stdout3, stderr3 = ssh.exec_command(cmd3)
        print("=== LATEST OUT LOGS ===")
        print(stdout3.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
