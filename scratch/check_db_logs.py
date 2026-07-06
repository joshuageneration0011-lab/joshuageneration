import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Read the start of the logs or search for DB logs
        cmd = "grep -C 3 -i database /root/.pm2/logs/joshuagen-backend-out.log"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== DATABASE LOG MATCHES ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
        # Let's also see the full out log (last 50 lines)
        cmd2 = "tail -50 /root/.pm2/logs/joshuagen-backend-out.log"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("=== LAST 50 OUT LOGS ===")
        print(stdout2.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
