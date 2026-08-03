import re

with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
lines = content.split('\n')
print("--- SERIESS AUDIOS MODIFIERS ---")
for i, line in enumerate(lines):
    if 'seriesAudios' in line or 'add track' in line.lower() or 'handleAddTrack' in line:
        if i > 500 and i < 1160:
            print(f"Line {i+1}: {line.strip()}")
