with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if '.status' in line or 'status:' in line or 'status =' in line:
        if 'sermon' in line.lower() or idx > 1000:
            print(f"Line {idx+1}: {line.strip()}")
