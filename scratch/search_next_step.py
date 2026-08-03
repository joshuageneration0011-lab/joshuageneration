with open(r"c:\Users\UCHE\Music\Webapp\joshuageneration.com\src\components\DonatePage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "handleNextStep" in line or "Proceed to Payment" in line or "const handleNextStep" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print some context
        for j in range(max(0, i-5), min(len(lines), i+30)):
            print(f"  {j+1}: {lines[j].strip()}")
        print("-" * 40)
