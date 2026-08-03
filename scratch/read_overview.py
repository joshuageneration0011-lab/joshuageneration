with open(r"C:\Users\UCHE\.gemini\antigravity\brain\4c340eae-17f0-4684-a9ef-d141be0ad2a0\.system_generated\logs\overview.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for line in lines[-100:]:
    print(line.strip())
