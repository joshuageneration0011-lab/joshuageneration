import paramiko
import os

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # SFTP upload
        sftp = ssh.open_sftp()
        local_path = r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js"
        remote_path = "/var/www/joshuageneration/server/server.js"
        print(f"Uploading {local_path} to {remote_path}...")
        sftp.put(local_path, remote_path)
        sftp.close()
        print("Upload completed.")
        
        # PM2 Restart
        cmd = "pm2 restart joshuagen-backend && pm2 status"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== RESTART OUTPUT ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
