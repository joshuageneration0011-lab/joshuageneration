import paramiko
import os
import sys

def main():
    workspace = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    files_to_upload = [
        "src/utils/api.ts",
        "src/App.tsx",
        "server/server.js"
    ]
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to Contabo VPS (84.46.243.59)...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        print("SSH Connection successful!")
        
        sftp = ssh.open_sftp()
        print("\n--- Uploading updated files to Contabo ---")
        for rel_path in files_to_upload:
            local_path = os.path.join(workspace, rel_path)
            remote_path = f"/var/www/joshuageneration/{rel_path}"
            print(f"Uploading: {rel_path} -> {remote_path}")
            sftp.put(local_path, remote_path)
            
        sftp.close()
        print("Files successfully uploaded to Contabo VPS!\n")
        
        # Git fetch and reset on server
        print("Executing: git fetch & reset on Contabo server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && git fetch origin main && git reset --hard origin/main")
        print(stdout.read().decode())
        
        # Build Frontend
        print("Executing: npm run build on Contabo server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && export PATH=/usr/local/bin:$PATH && npm run build")
        out = stdout.read().decode('utf-8', errors='replace')
        print(f"Build Output:\n{out}")

        # Restart PM2 Backend
        print("Executing: pm2 restart joshuagen-backend...")
        stdin, stdout, stderr = ssh.exec_command("pm2 restart joshuagen-backend")
        pm2_out = stdout.read().decode('utf-8', errors='replace')
        print(f"PM2 Output:\n{pm2_out}")

        print("\nSUCCESS! Pretty Links fix deployed to Contabo VPS successfully!")
        
    except Exception as e:
        print(f"Deployment error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
