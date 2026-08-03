import paramiko
import json

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to remote server via SSH...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        print("SSH Connection established successfully!")
        
        # Check files in uploads
        cmd = "ls -lh /var/www/joshuageneration/server/data/uploads | tail -n 10"
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("Uploaded files:")
        print(stdout.read().decode('utf-8'))
        
        # Check number of sermons in DB
        cmd2 = "PGPASSWORD=admin123 psql -U postgres -d postgres -c 'SELECT COUNT(*), MAX(id) FROM sermons;'"
        # Wait, is the DB credentials inside server.js? Let's check environment variable:
        # Actually, let's run a curl to the public api /api/sermons
        cmd2 = "curl -s https://joshuasgeneration.com/api/sermons | jq '. | length'"
        print(f"Executing: {cmd2}")
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        print("Sermons count on server API:")
        print(stdout.read().decode('utf-8'))
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
