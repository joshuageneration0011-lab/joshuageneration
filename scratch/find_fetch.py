with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\DonatePage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "fetch(" in line:
        print(f"Line {i+1}: {line.strip()}")
