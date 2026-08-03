with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(3500, len(lines)):
    line = lines[i]
    if "settings" in line.lower() or "activeTab" in line or "superadmin" in line.lower():
        print(f"{i+1}: {line.strip()}")
