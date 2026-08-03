import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        cmd = 'PGPASSWORD="GgCXXuFM5H40Yj4uv" psql -U jg_admin -d joshuagen -h localhost -p 5432 -c "\dt"'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== DATABASE TABLES ===")
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
