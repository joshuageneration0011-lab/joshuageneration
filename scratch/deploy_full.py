import paramiko
import os

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # SFTP Uploads
        sftp = ssh.open_sftp()
        
        # 1. DonatePage.tsx
        local_donate = r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\DonatePage.tsx"
        remote_donate = "/var/www/joshuageneration/src/components/DonatePage.tsx"
        print(f"Uploading {local_donate}...")
        sftp.put(local_donate, remote_donate)

        # 2. AdminDashboard.tsx
        local_admin = r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx"
        remote_admin = "/var/www/joshuageneration/src/components/AdminDashboard.tsx"
        print(f"Uploading {local_admin}...")
        sftp.put(local_admin, remote_admin)
        
        # 3. server.js
        local_server = r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js"
        remote_server = "/var/www/joshuageneration/server/server.js"
        print(f"Uploading {local_server}...")
        sftp.put(local_server, remote_server)
        
        sftp.close()
        print("Uploads completed successfully!")
        
        # Build and Restart
        print("Running npm run build on the server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && npm run build")
        build_out = stdout.read().decode('utf-8', errors='replace')
        build_err = stderr.read().decode('utf-8', errors='replace')
        print("=== BUILD OUTPUT ===")
        print(build_out)
        print("=== BUILD ERROR ===")
        print(build_err)
        
        print("Restarting backend PM2...")
        stdin, stdout, stderr = ssh.exec_command("pm2 restart joshuagen-backend")
        pm2_out = stdout.read().decode('utf-8', errors='replace')
        print("=== PM2 OUTPUT ===")
        print(pm2_out)
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
