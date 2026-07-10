with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if 'John Michael' in line or 'John Micheal' in line:
        print(f"Line {idx+1}: {line.strip()}")
