import json

with open(r"C:\Users\UCHE\.gemini\antigravity\brain\4c340eae-17f0-4684-a9ef-d141be0ad2a0\.system_generated\logs\overview.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get("source") == "USER":
            text = data.get("text", "")
            if "thumbnail" in text.lower() or "image" in text.lower() or "cover" in text.lower() or "sermon" in text.lower():
                print(f"USER: {text}")
    except Exception as e:
        pass
