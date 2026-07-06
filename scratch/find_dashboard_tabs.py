with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(98, 400):
    line = lines[i]
    if "menu" in line.lower() or "tab" in line.lower() or "role" in line.lower():
        print(f"{i+1}: {line.strip()}")
