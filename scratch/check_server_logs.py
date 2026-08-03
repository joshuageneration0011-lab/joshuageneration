import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Check PM2 logs for errors
        cmd = "pm2 logs joshuagen-backend --lines 30 --nostream 2>&1"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("=== PM2 LOGS ===")
        out = stdout.read().decode('utf-8', errors='replace')
        print(out[-3000:])  # Last 3000 chars
        
        # Check if node-fetch is installed
        cmd2 = "cd /var/www/joshuageneration/server && node -e \"import('node-fetch').then(m => console.log('node-fetch OK:', m.default)).catch(e => console.log('node-fetch ERROR:', e.message))\""
        stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
        print("=== node-fetch test ===")
        print(stdout2.read().decode('utf-8', errors='replace'))
        print(stderr2.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
