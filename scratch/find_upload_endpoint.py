with open('server/server.js', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
print("--- SEARCH FOR UPLOAD ROUTE ---")
found = False
for i, line in enumerate(lines):
    if '/api/upload' in line and not '/api/uploads' in line:
        print(f"Line {i+1}: {line.strip()}")
        found = True
        # print 50 lines
        for idx in range(i, min(len(lines), i + 60)):
            print(f"  {idx+1}: {lines[idx]}")
        break

if not found:
    print("Could not find exact /api/upload. Searching for any 'upload' route:")
    for i, line in enumerate(lines):
        if 'upload' in line.lower() and ('app.post' in line or 'app.use' in line or 'router.post' in line):
            print(f"Line {i+1}: {line.strip()}")
            for idx in range(max(0, i-2), min(len(lines), i + 25)):
                print(f"  {idx+1}: {lines[idx]}")
