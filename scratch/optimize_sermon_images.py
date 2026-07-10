import os
import paramiko
from PIL import Image

def main():
    # Credentials
    host = "84.46.243.59"
    user = "root"
    secret = "GgCXXuFM5H40Yj4uv"
    remote_dir = "/var/www/joshuageneration/server/data/uploads"
    local_temp_dir = os.path.join(os.getcwd(), "scratch", "temp_images")
    
    os.makedirs(local_temp_dir, exist_ok=True)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to live server...")
        ssh.connect(host, username=user, password=secret, timeout=30)
        sftp = ssh.open_sftp()
        
        # Get list of files
        print("Scanning remote uploads directory...")
        files = sftp.listdir(remote_dir)
        
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp')
        image_files = [f for f in files if os.path.splitext(f)[1].lower() in image_extensions]
        
        print(f"Found {len(image_files)} image files on the server.")
        
        total_original_size = 0
        total_optimized_size = 0
        optimized_count = 0
        
        for idx, filename in enumerate(image_files):
            remote_path = f"{remote_dir}/{filename}"
            local_raw_path = os.path.join(local_temp_dir, f"raw_{filename}")
            local_opt_path = os.path.join(local_temp_dir, f"opt_{filename}")
            
            # Get remote size
            stat = sftp.stat(remote_path)
            orig_size = stat.st_size
            total_original_size += orig_size
            
            # Download file
            print(f"\n[{idx+1}/{len(image_files)}] Downloading {filename} ({orig_size/1024:.1f} KB)...")
            sftp.get(remote_path, local_raw_path)
            
            # Compress image
            try:
                with Image.open(local_raw_path) as img:
                    w, h = img.size
                    # Resize if width is larger than 800px
                    if w > 800:
                        ratio = 800.0 / w
                        new_size = (800, int(h * ratio))
                        img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
                        print(f"  Resized from {w}x{h} to {new_size[0]}x{new_size[1]}")
                    else:
                        img_resized = img.copy()
                        print(f"  Resolution OK: {w}x{h}")
                    
                    ext = os.path.splitext(filename)[1].lower()
                    if ext in ('.jpg', '.jpeg'):
                        img_resized.convert('RGB').save(local_opt_path, 'JPEG', quality=75, optimize=True)
                    elif ext == '.png':
                        if img_resized.mode in ('RGBA', 'LA') or (img_resized.mode == 'P' and 'transparency' in img_resized.info):
                            # Preserve transparency
                            img_resized.save(local_opt_path, 'PNG', optimize=True)
                        else:
                            # Convert to adaptive 256 colors palette
                            img_resized.convert('P', palette=Image.ADAPTIVE).save(local_opt_path, 'PNG', optimize=True)
                    elif ext == '.webp':
                        img_resized.save(local_opt_path, 'WEBP', quality=75, method=6)
                    else:
                        img_resized.save(local_opt_path, optimize=True)
                
                opt_size = os.path.getsize(local_opt_path)
                total_optimized_size += opt_size
                
                # Check if it was actually reduced
                if opt_size < orig_size:
                    print(f"  Optimized: {orig_size/1024:.1f} KB -> {opt_size/1024:.1f} KB ({(1 - opt_size/orig_size)*100:.1f}% reduction)")
                    # Upload back to server
                    sftp.put(local_opt_path, remote_path)
                    optimized_count += 1
                else:
                    print(f"  No size improvement (keeping original).")
                    total_optimized_size += (orig_size - opt_size) # adjust bookkeeping
                    
            except Exception as e:
                print(f"  Error processing image: {e}")
                
            finally:
                # Cleanup local temp files
                if os.path.exists(local_raw_path):
                    os.remove(local_raw_path)
                if os.path.exists(local_opt_path):
                    os.remove(local_opt_path)
                    
        print("\n=============================================================")
        print(f"Bulk image optimization finished!")
        print(f"Images optimized/updated: {optimized_count}/{len(image_files)}")
        print(f"Total space before: {total_original_size/(1024*1024):.2f} MB")
        print(f"Total space after: {total_optimized_size/(1024*1024):.2f} MB")
        print(f"Net savings: {(total_original_size - total_optimized_size)/(1024*1024):.2f} MB")
        print("=============================================================")
        
        sftp.close()
    except Exception as e:
        print(f"SSH/SFTP Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
