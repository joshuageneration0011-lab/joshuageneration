const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@localhost:5432/joshuageneration"
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM settings WHERE id = 1");
    console.log("DB settings:", res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
