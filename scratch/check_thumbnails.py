import json
import os
from collections import Counter
from urllib.parse import urlparse

def main():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    private_file = '/Users/macbook/Downloads/joshuageneration/server/private_sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    for name, path in [('sermons.json', sermons_file), ('private_sermons.json', private_file), ('default_data.json', default_file)]:
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        sermon_list = data if isinstance(data, list) else data.get('sermons', [])
        
        domains = []
        for s in sermon_list:
            thumb = s.get('thumbnail', '')
            if thumb:
                parsed = urlparse(thumb)
                domains.append(parsed.netloc)
                
        print(f"\n{name} - Total: {len(sermon_list)} | With thumbnails: {len(domains)}")
        for dom, count in Counter(domains).most_common():
            print(f"  - {dom}: {count}")

        


if __name__ == '__main__':
    main()
