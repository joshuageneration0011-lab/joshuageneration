import json
import random

def main():
    private_file = "/Users/macbook/Downloads/joshuageneration/server/private_sermons.json"
    
    with open(private_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    random.seed(42)  # For deterministic output
    
    updated_count = 0
    for s in data:
        views = random.randint(150, 1500)
        s['views'] = views
        print(f"Sermon '{s['title']}' -> views set to {views}")
        updated_count += 1
        
    with open(private_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccessfully populated views for {updated_count} private sermons in private_sermons.json.")

if __name__ == '__main__':
    main()
