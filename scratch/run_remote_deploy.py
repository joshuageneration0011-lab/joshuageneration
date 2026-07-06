import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # 1. Fetch and reset hard to clean up local changes
        print("Cleaning up remote local changes and syncing with main...")
        cmd_reset = "cd /var/www/joshuageneration && git fetch origin && git reset --hard origin/main"
        stdin, stdout, stderr = ssh.exec_command(cmd_reset)
        print("=== RESET OUTPUT ===")
        print(stdout.read().decode('utf-8'))
        print(stderr.read().decode('utf-8'))
        
        # 2. Run deploy.sh
        print("Running deploy.sh on the remote server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration && chmod +x deploy.sh && ./deploy.sh")
        print("=== DEPLOY OUTPUT ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
