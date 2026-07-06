import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Print a chunk of AdminDashboard.tsx around the Flutterwave settings code on the server
        cmd = "grep -n -C 5 'Prophetic Offering Public Key' /var/www/joshuageneration/src/components/AdminDashboard.tsx"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("REMOTE FILE CONTENTS:")
        print(stdout.read().decode('utf-8'))
        print(stderr.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
