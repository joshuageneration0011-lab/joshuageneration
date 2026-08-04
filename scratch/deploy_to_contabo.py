import paramiko
import sys

# Ensure UTF-8 output encoding for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to Contabo VPS (84.46.243.59)...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        print("SSH Connection successful!\n")

        print("Executing: git pull origin main...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && git pull origin main")
        git_out = stdout.read().decode('utf-8', errors='replace')
        git_err = stderr.read().decode('utf-8', errors='replace')
        print(f"Git Output:\n{git_out}")
        if git_err:
            print(f"Git Notes:\n{git_err}")

        print("Executing: npm run build...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && npm run build")
        build_out = stdout.read().decode('utf-8', errors='replace')
        build_err = stderr.read().decode('utf-8', errors='replace')
        print(f"Build Output:\n{build_out}")
        if build_err:
            print(f"Build Notes:\n{build_err}")

        print("Executing: pm2 restart joshuagen-backend...")
        stdin, stdout, stderr = ssh.exec_command("pm2 restart joshuagen-backend")
        pm2_out = stdout.read().decode('utf-8', errors='replace')
        pm2_err = stderr.read().decode('utf-8', errors='replace')
        print(f"PM2 Output:\n{pm2_out}")

        print("Executing: Nginx configuration update and reload...")
        stdin, stdout, stderr = ssh.exec_command("cp /var/www/joshuageneration/nginx.conf /etc/nginx/sites-available/joshuageneration && nginx -t && systemctl reload nginx")
        ng_out = stdout.read().decode('utf-8', errors='replace')
        ng_err = stderr.read().decode('utf-8', errors='replace')
        print(f"Nginx Output:\n{ng_out}")
        if ng_err:
            print(f"Nginx Notes:\n{ng_err}")

        print("\nDeployment to Contabo completed successfully!")
    except Exception as e:
        print(f"Deployment error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
