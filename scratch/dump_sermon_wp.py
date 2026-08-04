import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    url = "https://joshuasgeneration.net/wp-json/wp/v2/sermon?per_page=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data:
                with open("scratch/sample_sermon_wp.json", "w", encoding="utf-8") as f:
                    json.dump(data[0], f, indent=2, ensure_ascii=False)
                print("Saved sample item to scratch/sample_sermon_wp.json")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
