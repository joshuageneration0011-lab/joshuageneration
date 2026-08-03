with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "pg" in line.lower() or "pool" in line.lower() or "database" in line.lower() or "sqlite" in line.lower() or "nedb" in line.lower() or "db" in line.lower() or "settings" in line.lower():
        if "const " in line or "let " in line or "connection" in line:
            print(f"Line {i+1}: {line.strip()}")
