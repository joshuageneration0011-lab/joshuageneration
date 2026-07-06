import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # List server data files and backups
        cmd = "ls -la /var/www/joshuageneration/server /var/www/joshuageneration/server/data"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== DIRECTORY LISTINGS ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        
        # Check system /tmp or similar for any settings file
        cmd2 = "find /var/www/joshuageneration -name '*settings*'"
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("=== SETTINGS FILES ===")
        print(stdout2.read().decode('utf-8', errors='replace'))

    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
