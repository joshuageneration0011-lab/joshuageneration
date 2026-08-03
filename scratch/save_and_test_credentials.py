import paramiko
import json

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Write credentials directly to settings.json
        settings = {
            "flutterwave_prophetic_client_id": "08a820fd-40d1-416b-83a0-8f12541908ea",
            "flutterwave_prophetic_client_secret": "o4V3aC8mozAuPZnGjue7ye7iAmeyluWo",
            "flutterwave_mission_client_id": "08a820fd-40d1-416b-83a0-8f12541908ea",
            "flutterwave_mission_client_secret": "o4V3aC8mozAuPZnGjue7ye7iAmeyluWo"
        }
        
        settings_json = json.dumps(settings, indent=2)
        cmd = f"echo '{settings_json}' > /var/www/joshuageneration/server/data/settings.json"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.read()
        
        # Verify
        cmd2 = "cat /var/www/joshuageneration/server/data/settings.json"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("=== SETTINGS SAVED ===")
        print(stdout2.read().decode('utf-8', errors='replace'))
        
        # Also test the endpoint again
        cmd3 = """curl -s -X POST http://127.0.0.1:5000/api/initiate-payment \
  -H 'Content-Type: application/json' \
  -d '{"cause":"Prophetic Offering","amount":10,"name":"Test User","email":"test@test.com","frequency":"one-time"}'"""
        stdin3, stdout3, stderr3 = ssh.exec_command(cmd3)
        print("\n=== PAYMENT ENDPOINT TEST ===")
        out = stdout3.read().decode('utf-8', errors='replace')
        print(out[:2000])
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
