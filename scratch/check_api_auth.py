with open('server/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print("--- AUTH SEARCH ---")
for idx, line in enumerate(lines):
    if 'Authorization' in line or 'bearer' in line.lower() or 'headers' in line.lower() or 'token' in line.lower():
        if idx > 900 and idx < 1050:
            print(f"Line {idx+1}: {line.strip()}")
