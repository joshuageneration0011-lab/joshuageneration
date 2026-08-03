import os

src_dir = "src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts", ".js")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                if "location.hash" in content or "hashchange" in content or "window.location.hash" in content:
                    print(f"Hash reference in {path}")
                    # Print lines with hash references
                    lines = content.splitlines()
                    for idx, line in enumerate(lines, 1):
                        if "location.hash" in line or "hashchange" in line:
                            print(f"  Line {idx}: {line.strip()}")
