import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect("84.46.243.59", username="root", password="GgCXXuFM5H40Yj4uv", timeout=30)
        
        # We can run a node script to query the database using the server config
        cmd = "node -e \"const pg = require('/var/www/joshuageneration/server/node_modules/pg'); const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/joshuageneration' }); pool.query('SELECT * FROM settings').then(res => { console.log(JSON.stringify(res.rows)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });\""
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
