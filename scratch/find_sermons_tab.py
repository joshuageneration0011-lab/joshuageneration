import sys

with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
for idx in range(1650, 1850):
    if idx < len(lines):
        line = lines[idx]
        try:
            print(f"{idx+1}: {line}")
        except UnicodeEncodeError:
            print(f"{idx+1}: {line.encode('ascii', 'ignore').decode('ascii')}")
