import paramiko
import os
import sys

def upload_dir(sftp, local_dir, remote_dir):
    for root, dirs, files in os.walk(local_dir):
        # Skip sermons and thumbnails subdirectories inside dist
        if "sermons" in root or "thumbnails" in root:
            continue
            
        rel_path = os.path.relpath(root, local_dir)
        if rel_path == ".":
            remote_root = remote_dir
        else:
            remote_root = os.path.join(remote_dir, rel_path).replace("\\", "/")
        
        try:
            sftp.mkdir(remote_root)
        except IOError:
            pass

        for f in files:
            local_file = os.path.join(root, f)
            remote_file = os.path.join(remote_root, f).replace("\\", "/")
            print(f"Uploading {local_file} -> {remote_file}", flush=True)
            sftp.put(local_file, remote_file)

def main():
    host = "84.46.243.59"
    user = "root"
    password = "GgCXXuFM5H40Yj4uv"

    print(f"Connecting to {host} via SSH...", flush=True)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password, timeout=30)
        sftp = ssh.open_sftp()
        
        base_dir = "/Users/macbook/Downloads/joshuageneration"
        remote_base = "/var/www/joshuageneration"

        # Single files to upload
        files_to_upload = [
            ("src/components/ImageGeneratorPage.tsx", "src/components/ImageGeneratorPage.tsx"),
            ("src/App.tsx", "src/App.tsx"),
            ("src/components/Navbar.tsx", "src/components/Navbar.tsx"),
            ("src/utils/api.ts", "src/utils/api.ts"),
            ("server/server.js", "server/server.js"),
            ("server/.env", "server/.env")
        ]

        for local_rel, remote_rel in files_to_upload:
            local_path = os.path.join(base_dir, local_rel)
            remote_path = f"{remote_base}/{remote_rel}"
            print(f"Uploading file {local_rel} -> {remote_path}...", flush=True)
            sftp.put(local_path, remote_path)

        # Upload dist/ directory (excluding heavy media)
        print("Uploading built dist/ assets to server...", flush=True)
        local_dist = os.path.join(base_dir, "dist")
        remote_dist = os.path.join(remote_base, "dist").replace("\\", "/")
        upload_dir(sftp, local_dist, remote_dist)

        sftp.close()
        print("All files & assets uploaded successfully!", flush=True)

        print("Restarting backend PM2 process...", flush=True)
        stdin, stdout, stderr = ssh.exec_command("bash -l -c 'cd /var/www/joshuageneration/server && pm2 restart joshuagen-backend --update-env'")
        pm2_out = stdout.read().decode('utf-8', errors='replace')
        print("=== PM2 OUTPUT ===", flush=True)
        print(pm2_out, flush=True)

        print("SUCCESS! Production Deployment Completed.", flush=True)

    except Exception as e:
        print(f"Deployment failed: {e}", flush=True)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
