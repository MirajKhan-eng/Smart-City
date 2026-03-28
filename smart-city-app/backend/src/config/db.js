const { Pool } = require("pg");
require("dotenv").config();

// This creates a "pool" of connections to your Postgres database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A quick check to see if the connection is successful
pool.on("connect", () => {
  console.log("✅ Connected to the PostgreSQL database");
});

module.exports = pool;
