import paramiko
import sys

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to server...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        print("Running deploy.sh on server...")
        cmd = "bash /var/www/joshuageneration/deploy.sh"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Stream output in real time
        for line in stdout:
            try:
                print(line, end="")
            except UnicodeEncodeError:
                try:
                    print(line.encode('utf-8', 'ignore').decode('utf-8'), end="")
                except Exception:
                    pass
            
        err = stderr.read().decode('utf-8')
        if err:
            print("\nError output:", file=sys.stderr)
            print(err, file=sys.stderr)
            
        print("\nDeployment execution finished.")
    except Exception as e:
        print("Exception occurred:", e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
