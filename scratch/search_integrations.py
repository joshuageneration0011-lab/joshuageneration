with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

found_tab = False
start_idx = 4505
for i in range(start_idx, len(lines)):
    line = lines[i]
    if "activeSetting === 'integrations'" in line:
        print(f"Found activeSetting === 'integrations' at line {i+1}")
        for j in range(i, min(i+150, len(lines))):
            print(f"{j+1}: {lines[j].strip()}")
        break
