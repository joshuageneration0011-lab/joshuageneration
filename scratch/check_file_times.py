import os
import time

def main():
    print("Files in workspace:")
    for f in os.listdir('.'):
        if f.startswith('temp_') or f.endswith('.py'):
            mtime = os.path.getmtime(f)
            size = os.path.getsize(f)
            print(f"  {f:<70} | Size: {size / (1024*1024):.2f}MB | Modified: {time.ctime(mtime)}")

if __name__ == "__main__":
    main()
