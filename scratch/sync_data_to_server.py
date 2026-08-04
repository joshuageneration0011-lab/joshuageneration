import paramiko
import sys
import os

def main():
    local_sermons_json = "/Users/macbook/Downloads/joshuageneration/server/data/sermons.json"
    remote_sermons_json = "/var/www/joshuageneration/server/data/sermons.json"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to contabo server (84.46.243.59)...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Open SFTP session
        print("Opening SFTP channel...")
        sftp = ssh.open_sftp()
        
        print(f"Uploading local {local_sermons_json} to remote {remote_sermons_json}...")
        sftp.put(local_sermons_json, remote_sermons_json)
        sftp.close()
        print("SFTP upload successful.")
        
        # Run sync_database.js on server
        print("Running sync_database.js on server to update Postgres database...")
        cmd = "cd /var/www/joshuageneration/server && node sync_database.js"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        for line in stdout:
            print(f"Server: {line}", end="")
            
        err = stderr.read().decode('utf-8')
        if err:
            print("\nServer Error:", err, file=sys.stderr)
            
        # Restart backend pm2 process
        print("Restarting pm2 backend service on server...")
        cmd_restart = "pm2 restart joshuagen-backend --update-env"
        stdin, stdout, stderr = ssh.exec_command(cmd_restart)
        
        for line in stdout:
            print(f"PM2: {line}", end="")
            
        err_restart = stderr.read().decode('utf-8')
        if err_restart:
            print("\nPM2 Error:", err_restart, file=sys.stderr)
            
        print("\nSync and deployment complete!")
        
    except Exception as e:
        print("An error occurred:", e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
