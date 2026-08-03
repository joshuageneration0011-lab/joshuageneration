import os

def search():
    keywords = ['John Michael', 'John Micheal', 'Pastor John']
    for root, dirs, files in os.walk('.'):
        # Skip node_modules, git, dist
        if any(p in root for p in ['node_modules', '.git', 'dist', '.gemini']):
            continue
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.json')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    for keyword in keywords:
                        if keyword in content:
                            print(f"Found '{keyword}' in {path}")
                except Exception as e:
                    pass

if __name__ == "__main__":
    search()
