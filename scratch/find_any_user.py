with open(r"C:\Users\UCHE\.gemini\antigravity\brain\4c340eae-17f0-4684-a9ef-d141be0ad2a0\.system_generated\logs\overview.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    if "USER" in line or "user" in line:
        print(line[:200])
