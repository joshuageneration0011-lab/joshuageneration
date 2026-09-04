import paramiko
import os
import sys

def main():
    workspace = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"Workspace root: {workspace}")
    
    files_to_upload = [
        "src/components/CaptchaChallenge.tsx",
        "src/components/GetUpdatesPage.tsx",
        "src/components/SonsDaughtersPage.tsx",
        "src/components/NewsletterPopup.tsx",
        "src/components/Footer.tsx",
        "src/components/SouthAfricaUpdatesPage.tsx",
        "src/utils/api.ts",
        "server/server.js"
    ]
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("\nConnecting to Contabo VPS (84.46.243.59)...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        print("SSH Connection successful!")
        
        sftp = ssh.open_sftp()
        print("\n--- Uploading updated files to Contabo ---")
        for rel_path in files_to_upload:
            local_path = os.path.join(workspace, rel_path)
            remote_path = f"/var/www/joshuageneration/{rel_path}"
            
            # Ensure remote directory exists
            remote_dir = os.path.dirname(remote_path)
            try:
                ssh.exec_command(f"mkdir -p {remote_dir}")
            except Exception as e:
                pass
                
            print(f"Uploading: {rel_path} -> {remote_path}")
            sftp.put(local_path, remote_path)
            
        sftp.close()
        print("Files successfully uploaded to Contabo VPS!\n")
        
        # Build frontend on server
        print("Executing: npm run build on Contabo server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && export PATH=/usr/local/bin:$PATH && npm run build")
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        print(f"Build Output:\n{out}")
        if err:
            print(f"Build Notes/Errors:\n{err}")
            
        # Restart PM2 backend on server
        print("Executing: pm2 restart joshuagen-backend...")
        stdin, stdout, stderr = ssh.exec_command("pm2 restart joshuagen-backend")
        pm2_out = stdout.read().decode('utf-8', errors='replace')
        print(f"PM2 Output:\n{pm2_out}")

        # Check git status on server
        print("Checking git status on server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && git status")
        git_out = stdout.read().decode('utf-8', errors='replace')
        print(f"Server Git Status:\n{git_out}")
        
        print("\nSUCCESS! Deployment to Contabo VPS completed successfully!")
        
    except Exception as e:
        print(f"Deployment error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
