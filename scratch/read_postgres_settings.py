import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Check settings table content in postgres
        cmd = "PGPASSWORD='joshuagen_pass' psql -U joshuagen_user -d joshuageneration -c 'SELECT * FROM settings;'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== POSTGRES SETTINGS ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
