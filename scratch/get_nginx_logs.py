import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to remote server via SSH...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        print("SSH Connection established successfully!")
        
        # Read Nginx error logs
        cmd = "tail -n 100 /var/log/nginx/error.log"
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        log_content = stdout.read().decode('utf-8', errors='ignore')
        print(log_content.encode('ascii', errors='replace').decode('ascii'))
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
