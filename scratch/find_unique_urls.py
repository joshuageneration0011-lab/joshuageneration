import json
import os

def main():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    private_file = '/Users/macbook/Downloads/joshuageneration/server/private_sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    urls_to_fetch = set()
    
    # Check sermons.json
    if os.path.exists(sermons_file):
        with open(sermons_file, 'r', encoding='utf-8') as f:
            sermons = json.load(f)
        for s in sermons:
            if s.get('duration') == '45:00' and s.get('audioUrl'):
                urls_to_fetch.add(s.get('audioUrl'))
            for t in s.get('audios', []):
                if t.get('duration') == '45:00' and t.get('audioUrl'):
                    urls_to_fetch.add(t.get('audioUrl'))
                    
    # Check private_sermons.json
    if os.path.exists(private_file):
        with open(private_file, 'r', encoding='utf-8') as f:
            private = json.load(f)
        for s in private:
            if s.get('duration') == '45:00' and s.get('audioUrl'):
                urls_to_fetch.add(s.get('audioUrl'))
            for t in s.get('audios', []):
                if t.get('duration') == '45:00' and t.get('audioUrl'):
                    urls_to_fetch.add(t.get('audioUrl'))
                    
    # Check default_data.json
    if os.path.exists(default_file):
        with open(default_file, 'r', encoding='utf-8') as f:
            defaults = json.load(f)
        for s in defaults.get('sermons', []):
            if s.get('duration') == '45:00' and s.get('audioUrl'):
                urls_to_fetch.add(s.get('audioUrl'))
            for t in s.get('audios', []):
                if t.get('duration') == '45:00' and t.get('audioUrl'):
                    urls_to_fetch.add(t.get('audioUrl'))
                    
    print(f"Total unique URLs to fetch: {len(urls_to_fetch)}")
    for url in sorted(list(urls_to_fetch))[:10]:
        print(f" - {url}")
    if len(urls_to_fetch) > 10:
        print(f" ... and {len(urls_to_fetch)-10} more")

if __name__ == '__main__':
    main()
