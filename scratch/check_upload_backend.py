with open('server/server.js', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
print("--- UPLOAD ENDPOINT ---")
for i, line in enumerate(lines):
    if '/api/upload' in line or 'app.post(\'/api/upload\'' in line or 'app.post("/api/upload"' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print 50 lines starting from i
        for idx in range(i, min(len(lines), i + 60)):
            print(f"  {idx+1}: {lines[idx]}")
        break
