with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "currentPage" in line or "const navigate =" in line or "const [currentPage" in line:
        print(f"{i+1}: {line.strip()}")
