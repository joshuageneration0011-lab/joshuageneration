import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # Run node inline by sourcing PM2 env or sourcing the process env directly
        # pm2 has a command "pm2 env 0" which shows all environment variables.
        # We can extract the DATABASE_URL from it.
        cmd = "DATABASE_URL=$(pm2 env 0 | grep -oP 'DATABASE_URL => \\K[^, ]+') node -e \"const pg = require('/var/www/joshuageneration/server/node_modules/pg'); const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT * FROM settings').then(res => { console.log(JSON.stringify(res.rows)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });\""
        
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("DATABASE SETTINGS ROWS:")
        print(stdout.read().decode('utf-8'))
        print(stderr.read().decode('utf-8'))
    except Exception as e:
        print(e)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
