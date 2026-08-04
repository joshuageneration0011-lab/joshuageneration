import paramiko
import os

def main():
    local_dir = "/Users/macbook/Downloads/joshuageneration/public/thumbnails"
    remote_dir = "/var/www/joshuageneration/public/thumbnails"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to contabo server (84.46.243.59)...")
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Open SFTP session
        print("Opening SFTP channel...")
        sftp = ssh.open_sftp()
        
        # List local files
        local_files = os.listdir(local_dir)
        local_files = [f for f in local_files if not f.startswith('.')]
        
        # List remote files to delete any obsolete files (like old .png files that were replaced by .jpg)
        print("Retrieving remote thumbnail list...")
        try:
            remote_files = sftp.listdir(remote_dir)
        except IOError:
            print("Remote directory doesn't exist. Creating it...")
            sftp.mkdir(remote_dir)
            remote_files = []
            
        print(f"Syncing {len(local_files)} files...")
        
        # Upload all local files
        for f in local_files:
            l_path = os.path.join(local_dir, f)
            r_path = remote_dir + "/" + f
            print(f"Uploading {f} ({os.path.getsize(l_path)/1024:.1f} KB)...")
            sftp.put(l_path, r_path)
            
        # Delete remote files that are not present locally (e.g. the old private_48315.png)
        for rf in remote_files:
            if rf not in local_files:
                r_path = remote_dir + "/" + rf
                print(f"Deleting obsolete remote file: {rf}")
                try:
                    sftp.remove(r_path)
                except Exception as ex:
                    print(f"Error deleting {rf}: {ex}")
                    
        # Also upload the updated private_sermons.json
        local_private_json = "/Users/macbook/Downloads/joshuageneration/server/private_sermons.json"
        remote_private_json = "/var/www/joshuageneration/server/private_sermons.json"
        print(f"\nUploading updated private_sermons.json...")
        sftp.put(local_private_json, remote_private_json)
        
        sftp.close()
        
        # Run database sync on server to sync private_sermons.json updates to Postgres
        print("\nRunning sync_database.js on server...")
        stdin, stdout, stderr = ssh.exec_command("cd /var/www/joshuageneration/server && node sync_database.js")
        for line in stdout:
            print(f"Server: {line}", end="")
            
        err = stderr.read().decode('utf-8')
        if err:
            print("\nServer Error:", err)
            
        # Restart backend
        print("Restarting pm2 backend service on server...")
        ssh.exec_command("pm2 restart joshuagen-backend --update-env")
        
        print("\nLocal thumbnail sync and server database update complete!")
        
    except Exception as e:
        print("An error occurred during thumbnail sync:", e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
