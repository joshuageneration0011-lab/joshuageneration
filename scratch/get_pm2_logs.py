import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        cmd = "pm2 logs joshuagen-backend --lines 50 --nostream"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("REMOTE LOGS:")
        print(stdout.read().decode('utf-8'))
        print(stderr.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
