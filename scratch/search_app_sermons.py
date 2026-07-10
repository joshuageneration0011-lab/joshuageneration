with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if 'FeaturedSermons' in line:
        print(f"Line {idx+1}: {line.strip()}")
        start = max(0, idx - 10)
        end = min(len(lines), idx + 15)
        print("CONTEXT:")
        for k in range(start, end):
            print(f"  {k+1}: {lines[k]}")
        print("-" * 50)
