import os

files_to_modify = [
    'src/components/AdminDashboard.tsx',
    'src/components/LiveNowBanner.tsx',
    'src/components/LivePlatform.tsx',
    'src/data/mockData.ts',
    'server/server.js',
    'server/default_data.json',
    'server/data/blog_posts.json',
    'server/data/books.json',
    'server/data/events.json',
    'server/data/sermons.json'
]

replacements = {
    'Pastor John Michael': 'Apostle Joshua Iyemifokhae',
    'Pastor John Micheal': 'Apostle Joshua Iyemifokhae',
    'John Michael': 'Joshua Iyemifokhae',
    'John Micheal': 'Joshua Iyemifokhae'
}

for path in files_to_modify:
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified_content = content
        count = 0
        for old, new in replacements.items():
            if old in modified_content:
                count += modified_content.count(old)
                modified_content = modified_content.replace(old, new)
        
        if count > 0:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            print(f"Updated {count} occurrences in {path}")
        else:
            print(f"No occurrences found in {path}")
    except Exception as e:
        print(f"Error updating {path}: {e}")
