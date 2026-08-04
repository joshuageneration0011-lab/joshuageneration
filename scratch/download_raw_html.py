import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    url = "https://joshuasgeneration.net/sermon/the-foundation-of-prayer-by-apostle-joshua-iyemifokhae/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print("Length of HTML:", len(html))
            # Save raw HTML to a file
            with open("scratch/raw_private_archive.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("Saved raw HTML to scratch/raw_private_archive.html")
            
            # Let's check for any mention of views
            import re
            matches = re.findall(r'(\d+\s*views|views?\s*:\s*\d+|\d+\s*clicks)', html, re.IGNORECASE)
            print("Regex matches for views/clicks:", matches)
            
            # Print any span/div classes containing view or count
            matches_class = re.findall(r'<[^>]+class="[^"]*(view|count)[^"]*"[^>]*>', html, re.IGNORECASE)
            print("Classes containing view/count:", set(matches_class[:20]))
            
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
