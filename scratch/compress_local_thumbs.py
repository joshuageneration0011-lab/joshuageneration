import os
import subprocess
import json

def main():
    thumb_dir = "/Users/macbook/Downloads/joshuageneration/public/thumbnails"
    private_file = "/Users/macbook/Downloads/joshuageneration/server/private_sermons.json"
    
    # 1. Compress all local images using sips
    print("Compressing local thumbnails in public/thumbnails...")
    files = os.listdir(thumb_dir)
    
    # Track which files were converted to .jpg so we can update references
    converted_pngs = {}
    
    for f in files:
        if f.startswith('.'):
            continue
        path = os.path.join(thumb_dir, f)
        if not os.path.isfile(path):
            continue
            
        size_before = os.path.getsize(path)
        print(f"\nProcessing {f} ({size_before / 1024:.1f} KB)...")
        
        if f.lower().endswith('.png'):
            # Convert PNG to JPG and resize to max width 400
            new_filename = f[:-4] + ".jpg"
            out_path = os.path.join(thumb_dir, new_filename)
            
            # Use sips to convert to jpeg, resize, and compress
            cmd = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "75", "--resampleWidth", "400", path, "--out", out_path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            if res.returncode == 0:
                size_after = os.path.getsize(out_path)
                print(f" -> Converted and compressed PNG to JPG: {new_filename} ({size_after / 1024:.1f} KB)")
                # Delete the old PNG file
                os.remove(path)
                converted_pngs[f] = new_filename
            else:
                print(f" -> Error converting PNG: {res.stderr.decode('utf-8')}")
                
        elif f.lower().endswith(('.jpg', '.jpeg')):
            # Compress and resize JPEG in place
            cmd = ["sips", "--resampleWidth", "400", "-s", "formatOptions", "75", path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            if res.returncode == 0:
                size_after = os.path.getsize(path)
                print(f" -> Compressed JPG in place: {f} ({size_after / 1024:.1f} KB)")
            else:
                print(f" -> Error compressing JPG: {res.stderr.decode('utf-8')}")
                
    # 2. Update private_sermons.json with new .jpg extensions if any PNGs were converted
    if converted_pngs and os.path.exists(private_file):
        print("\nUpdating private_sermons.json references...")
        with open(private_file, 'r', encoding='utf-8') as pf:
            private_data = json.load(pf)
            
        updated = False
        for s in private_data:
            thumb = s.get('thumbnail', '')
            # check if thumbnail path matches a converted PNG filename
            for png_name, jpg_name in converted_pngs.items():
                if png_name in thumb:
                    s['thumbnail'] = thumb.replace(png_name, jpg_name)
                    print(f" -> Updated private sermon {s['id']} thumbnail reference: {png_name} -> {jpg_name}")
                    updated = True
                    
        if updated:
            with open(private_file, 'w', encoding='utf-8') as pf:
                json.dump(private_data, pf, indent=2, ensure_ascii=False)
            print("Saved updated private_sermons.json.")

if __name__ == '__main__':
    main()
