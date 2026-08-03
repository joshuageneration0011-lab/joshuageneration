import os

def search():
    keywords = ['FeaturedSermons', 'sermons']
    for root, dirs, files in os.walk('.'):
        if any(p in root for p in ['node_modules', '.git', 'dist', '.gemini']):
            continue
        for file in files:
            if file == 'App.tsx' or file == 'HomePage.tsx' or 'Home' in file:
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    print(f"File: {path}")
                    for line in content.split('\n'):
                        if 'FeaturedSermons' in line or 'sermons=' in line:
                            print(f"  {line.strip()}")
                except Exception as e:
                    pass

if __name__ == "__main__":
    search()
