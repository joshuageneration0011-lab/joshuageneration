with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function SettingsTab" in line or "const SettingsTab" in line:
        print(f"SettingsTab definition line: {i+1}")
        
    if "flutterwave_key" in line or "flutterwave_prophetic_key" in line or "propheticKey" in line:
        print(f"{i+1}: {line.strip()}")
