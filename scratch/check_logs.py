import paramiko
import sys

hostname = 'joshuasgeneration.com'
username = 'root'
password = 'GgCXXuFM5H40Yj4uv'
command = 'ls -la /etc/nginx/sites-enabled/'

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=30)
    
    stdin, stdout, stderr = client.exec_command(command)
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'), file=sys.stderr)
    
    client.close()
except Exception as e:
    print(f"SSH failed: {e}", file=sys.stderr)
