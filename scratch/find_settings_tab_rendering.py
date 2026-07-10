with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
for idx in range(1039, 1115):
    if idx < len(lines):
        print(f"{idx+1}: {lines[idx]}")
