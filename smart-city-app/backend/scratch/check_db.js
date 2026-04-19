const { Pool } = require("pg");
require("dotenv").config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Existing Tables:", res.rows.map(r => r.table_name));
    
    // Check users table columns
    const usersCols = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'users'
    `);
    console.log("Users Columns:", usersCols.rows.map(r => r.column_name));

  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
