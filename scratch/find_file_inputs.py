with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
print("--- FILE INPUTS ---")
for i, line in enumerate(lines):
    if 'type="file"' in line or 'accept="audio/*' in line or 'accept="image/*' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print 5 lines before and after
        start = max(0, i - 5)
        end = min(len(lines), i + 8)
        print("CONTEXT:")
        for idx in range(start, end):
            print(f"  {idx+1}: {lines[idx]}")
        print("-" * 50)
