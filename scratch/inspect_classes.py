import re

def main():
    with open("scratch/raw_private_archive.html", "r", encoding="utf-8") as f:
        html = f.read()
        
    # Find tag blocks containing class with 'view' or 'count'
    pattern = r'(<[^>]+class="[^"]*(view|count)[^"]*"[^>]*>.*?</[^>]+>|<[^>]+class="[^"]*(view|count)[^"]*"[^>]*>[^<]*)'
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)
    
    print(f"Found {len(matches)} matches.")
    for idx, m in enumerate(matches[:30]):
        # clean whitespace
        clean = re.sub(r'\s+', ' ', m[0])[:120]
        print(f"[{idx+1}] {clean}")

if __name__ == '__main__':
    main()
