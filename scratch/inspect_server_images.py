import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        print("--- LIST OF ALL IMAGE FILES IN UPLOADS ---")
        cmd = "find /var/www/joshuageneration/server/data/uploads -type f \\( -name \"*.jpg\" -o -name \"*.jpeg\" -o -name \"*.png\" -o -name \"*.webp\" -o -name \"*.gif\" \\) -exec ls -lh {} +"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode('utf-8'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
