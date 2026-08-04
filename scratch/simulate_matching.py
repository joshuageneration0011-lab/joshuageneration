import json
import os

def main():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    private_file = '/Users/macbook/Downloads/joshuageneration/server/private_sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    with open(sermons_file, 'r', encoding='utf-8') as f:
        sermons = json.load(f)
    with open(default_file, 'r', encoding='utf-8') as f:
        defaults = json.load(f)
    default_sermons = defaults.get('sermons', [])
    defaults_by_id = {s['id']: s for s in default_sermons}
    
    # 1. Update sermons from default_data.json where possible
    for s in sermons:
        sid = s['id']
        if sid in defaults_by_id:
            def_s = defaults_by_id[sid]
            if s.get('duration') == '45:00' and def_s.get('duration') != '45:00':
                s['duration'] = def_s.get('duration')
                
    # 2. Count remaining 45:00 URLs
    remaining_urls = set()
    for s in sermons:
        if s.get('duration') == '45:00' and s.get('audioUrl'):
            remaining_urls.add(s.get('audioUrl'))
        for t in s.get('audios', []):
            if t.get('duration') == '45:00' and t.get('audioUrl'):
                remaining_urls.add(t.get('audioUrl'))
                
    print(f"Remaining unique URLs to fetch: {len(remaining_urls)}")
    for url in sorted(list(remaining_urls))[:10]:
        print(f" - {url}")

if __name__ == '__main__':
    main()
