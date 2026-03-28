const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// --- 1. MIDDLEWARE (Must come BEFORE routes) ---
app.use(cors()); // Fixes the "CORS Policy" error
app.use(express.json()); // Allows reading data from the frontend form

// --- 2. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// --- 3. BASIC TEST ROUTE ---
app.get('/', (req, res) => {
  res.send('🏙️ Smart City API is running and healthy!');
});

// --- 4. DATABASE CONNECTION TEST ---
const checkDbConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to the PostgreSQL database (Supabase)');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }
};

checkDbConnection();

// --- 5. SERVER STARTUP ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on http://localhost:${PORT}`);
});