with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "SettingsTab" in line or "settings" in line.lower():
        if "button" in line or "tab" in line or "role" in line or "render" in line or "active" in line:
            print(f"{i+1}: {line.strip()}")
