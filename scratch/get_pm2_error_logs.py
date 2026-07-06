import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        stdin, stdout, stderr = ssh.exec_command("tail -n 50 /root/.pm2/logs/joshuagen-backend-error.log")
        print("ERROR LOGS:")
        print(stdout.read().decode('utf-8'))
        
        stdin, stdout, stderr = ssh.exec_command("tail -n 50 /root/.pm2/logs/joshuagen-backend-out.log")
        print("OUT LOGS:")
        print(stdout.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
