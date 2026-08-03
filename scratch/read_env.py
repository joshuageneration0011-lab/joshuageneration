import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Read .env file in server dir
        cmd = "cat /var/www/joshuageneration/server/.env"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== SERVER .ENV ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
        # Also query postgres using connection string from env if any, or print settings table using the database url
        cmd_db = "pm2 env joshuagen-backend | grep -i DATABASE_URL"
        stdin_db, stdout_db, stderr_db = ssh.exec_command(cmd_db)
        print("=== DATABASE URL from PM2 ===")
        print(stdout_db.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
