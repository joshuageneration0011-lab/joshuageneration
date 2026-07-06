import paramiko
import json

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)

        # Test the endpoint directly on the backend (bypassing nginx)
        cmd = """curl -s -X POST http://127.0.0.1:5000/api/initiate-payment \
  -H 'Content-Type: application/json' \
  -d '{"cause":"Prophetic Offering","amount":10,"name":"Test User","email":"test@test.com","frequency":"one-time"}'"""
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== DIRECT BACKEND RESPONSE ===")
        print(stdout.read().decode('utf-8', errors='replace'))

        # Check what's stored in the settings file
        cmd2 = "cat /var/www/joshuageneration/server/data/settings.json"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("\n=== SETTINGS FILE ===")
        print(stdout2.read().decode('utf-8', errors='replace'))

        # Check most recent log
        cmd3 = "tail -10 /root/.pm2/logs/joshuagen-backend-error.log"
        stdin3, stdout3, stderr3 = ssh.exec_command(cmd3)
        print("\n=== LATEST ERRORS ===")
        print(stdout3.read().decode('utf-8', errors='replace'))

    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
