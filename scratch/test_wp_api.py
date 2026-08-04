import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_api():
    urls = [
        "https://joshuasgeneration.net/wp-json/wp/v2/sermons",
        "https://joshuasgeneration.net/wp-json/wp/v2/sermon",
        "https://joshuasgeneration.net/wp-json/wp/v2/posts?categories=sons-daughters-private"
    ]
    
    for url in urls:
        print(f"Trying: {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data:
                    print(f" -> SUCCESS! Found {len(data)} items.")
                    print("Sample item keys:", list(data[0].keys()))
                    # Look for anything like 'views', 'post_views', 'meta', 'custom_fields'
                    print("Sample item metadata / fields:")
                    for k in ['views', 'post_views_count', 'meta', 'post_views']:
                        if k in data[0]:
                            print(f"   {k}: {data[0][k]}")
                    if 'meta' in data[0]:
                        print("   meta keys:", list(data[0]['meta'].keys()))
                    return
        except Exception as e:
            print(f" -> Failed: {e}")

if __name__ == '__main__':
    test_api()
