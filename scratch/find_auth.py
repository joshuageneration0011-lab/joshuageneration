with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "getAuthenticatedUser" in line:
        print(f"Line {i+1}: {line.strip()}")
