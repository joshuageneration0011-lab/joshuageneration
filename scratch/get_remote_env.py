import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Read .env file in project root
        cmd = "cat /var/www/joshuageneration/.env"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("REMOTE .ENV CONTENT:")
        print(stdout.read().decode('utf-8'))
        
        # Read .env file in server directory
        cmd2 = "cat /var/www/joshuageneration/server/.env"
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        print("REMOTE SERVER .ENV CONTENT:")
        print(stdout.read().decode('utf-8'))
        
        # pm2 env
        cmd3 = "pm2 show joshuagen-backend"
        stdin, stdout, stderr = ssh.exec_command(cmd3)
        print("PM2 ENVIRONMENT:")
        print(stdout.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
