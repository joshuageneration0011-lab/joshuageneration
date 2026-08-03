with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "admin@" in line or "superadmin" in line or "role" in line:
        if "insert" in line.lower() or "user" in line.lower() or "const" in line.lower() or "let" in line.lower():
            print(f"{i+1}: {line.strip()}")
