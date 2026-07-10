import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Search for download text or handleDownloadIncrement in SermonsPage chunk
        cmd = "grep -o -i 'handleDownloadIncrement' /var/www/joshuageneration/dist/assets/SermonsPage-BK-MiveN.js || echo 'Not found'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("Search for 'handleDownloadIncrement':", stdout.read().decode('utf-8').strip())
        
        cmd2 = "grep -o -i 'download' /var/www/joshuageneration/dist/assets/SermonsPage-BK-MiveN.js || echo 'Not found'"
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        print("Search for 'download':", stdout.read().decode('utf-8').strip())
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
