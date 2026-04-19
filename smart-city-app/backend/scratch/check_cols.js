const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkCols() {
  const reportsCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'");
  console.log("Reports Columns:", reportsCols.rows.map(r => r.column_name));
  
  const votesCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'report_votes'");
  console.log("Votes Columns:", votesCols.rows.map(r => r.column_name));
  
  await pool.end();
}
checkCols();
