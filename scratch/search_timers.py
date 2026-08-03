import os

src_dir = "src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts", ".js")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                if "setInterval" in content or "setTimeout" in content or "5000" in content:
                    print(f"Timer reference in {path}")
                    # Print lines with timers
                    lines = content.splitlines()
                    for idx, line in enumerate(lines, 1):
                        if "setInterval" in line or "setTimeout" in line or "5000" in line:
                            print(f"  Line {idx}: {line.strip()}")
