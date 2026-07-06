with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "export default function AdminDashboard" in line or "function AdminDashboard" in line:
        print(f"{i+1}: {line.strip()}")
