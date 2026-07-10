with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
print("--- SUBMIT BUTTONS ---")
for i, line in enumerate(lines):
    if 'type="submit"' in line or 'Save Sermon' in line:
        if i > 1200:
            print(f"Line {i+1}: {line.strip()}")
            start = max(0, i - 3)
            end = min(len(lines), i + 4)
            print("CONTEXT:")
            for idx in range(start, end):
                print(f"  {idx+1}: {lines[idx]}")
            print("-" * 50)
