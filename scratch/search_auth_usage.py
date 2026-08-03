with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\server\server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "getAuthenticatedUser" in line or "401" in line:
        print(f"{i+1}: {line.strip()}")
