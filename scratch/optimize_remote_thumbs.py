import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

def check_remote_url_exists(url):
    """Run a fast curl HEAD request to check if a remote file exists (returns 200)."""
    try:
        cmd = ["curl", "-I", "-L", "-k", "-s", "--connect-timeout", "5", url]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = res.stdout.decode('utf-8', errors='ignore')
        
        # Check if output contains "HTTP/1.1 200" or "HTTP/2 200"
        if re.search(r'HTTP/\S+\s+200', output):
            return True
    except Exception:
        pass
    return False

# We need re module
import re

def process_thumbnail_url(url):
    """
    Given a WordPress URL, e.g.:
    https://joshuasgeneration.net/wp-content/uploads/2026/02/Image.jpg
    Returns the optimized URL if it exists, otherwise the original.
    """
    if not url or "wp-content/uploads" not in url:
        return url, False
        
    # Check if already has a size suffix (like -300x300, -1024x1024, -scaled etc.)
    if re.search(r'-\d+x\d+\.(jpg|png|jpeg)$', url, re.IGNORECASE) or "-scaled." in url:
        # If it has a larger size suffix, e.g. -1024x1024, let's try to replace it with -300x300
        smaller_url = re.sub(r'(-\d+x\d+|-scaled)(\.(jpg|png|jpeg))$', r'-300x300\2', url, flags=re.IGNORECASE)
        if check_remote_url_exists(smaller_url):
            return smaller_url, True
        return url, False
        
    # Standard URL, try inserting -300x300 before extension
    match = re.search(r'(\.(jpg|png|jpeg))$', url, re.IGNORECASE)
    if not match:
        return url, False
        
    smaller_url = url[:-len(match.group(1))] + "-300x300" + match.group(1)
    if check_remote_url_exists(smaller_url):
        return smaller_url, True
        
    # If -300x300 doesn't exist, let's keep the original
    return url, False

def main():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    with open(sermons_file, 'r', encoding='utf-8') as f:
        sermons = json.load(f)
        
    urls_to_check = []
    sermon_indices = []
    
    for idx, s in enumerate(sermons):
        thumb = s.get('thumbnail', '')
        if thumb and "wp-content/uploads" in thumb:
            urls_to_check.append(thumb)
            sermon_indices.append(idx)
            
    print(f"Checking {len(urls_to_check)} remote sermon thumbnails for smaller -300x300 versions...")
    
    optimized_urls = {}
    if urls_to_check:
        with ThreadPoolExecutor(max_workers=20) as executor:
            # Submit all checks
            future_to_url = {executor.submit(process_thumbnail_url, url): url for url in urls_to_check}
            
            completed = 0
            for future in as_completed(future_to_url):
                orig_url = future_to_url[future]
                completed += 1
                try:
                    opt_url, is_optimized = future.result()
                    if is_optimized:
                        optimized_urls[orig_url] = opt_url
                        print(f"[{completed}/{len(urls_to_check)}] Found optimized: {os.path.basename(opt_url)}")
                    else:
                        # Print dot for non-optimized to avoid cluttering
                        print(f"[{completed}/{len(urls_to_check)}] Kept original: {os.path.basename(orig_url)}")
                except Exception as e:
                    print(f"[{completed}/{len(urls_to_check)}] Error checking {orig_url}: {e}")
                    
    # Update sermons.json
    updated_count = 0
    for idx in sermon_indices:
        s = sermons[idx]
        thumb = s.get('thumbnail')
        if thumb in optimized_urls:
            s['thumbnail'] = optimized_urls[thumb]
            updated_count += 1
            
    # Save sermons.json
    with open(sermons_file, 'w', encoding='utf-8') as f:
        json.dump(sermons, f, indent=2, ensure_ascii=False)
    print(f"\nSuccessfully optimized {updated_count} remote thumbnails in sermons.json.")
    
    # Update default_data.json to keep in sync
    if os.path.exists(default_file):
        with open(default_file, 'r', encoding='utf-8') as f:
            defaults = json.load(f)
            
        default_sermons = defaults.get('sermons', [])
        sermons_by_id = {s['id']: s for s in sermons}
        
        sync_count = 0
        for s in default_sermons:
            sid = s['id']
            if sid in sermons_by_id:
                new_thumb = sermons_by_id[sid].get('thumbnail')
                if s.get('thumbnail') != new_thumb:
                    s['thumbnail'] = new_thumb
                    sync_count += 1
                    
        with open(default_file, 'w', encoding='utf-8') as f:
            json.dump(defaults, f, indent=2, ensure_ascii=False)
        print(f"Synchronized {sync_count} optimized thumbnails to default_data.json.")

if __name__ == '__main__':
    main()
