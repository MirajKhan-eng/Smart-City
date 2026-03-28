const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// --- CITIZEN ROUTE: Submit a new report ---
router.post('/submit', async (req, res) => {
  const { user_id, title, description, category, location } = req.body;
  try {
    const newReport = await pool.query(
      'INSERT INTO reports (user_id, title, description, category, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, title, description, category, location]
    );
    res.json({ message: "Report submitted successfully!", report: newReport.rows[0] });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "Server error while submitting report" });
  }
});

// --- ADMIN ROUTE: Get all reports for the city dashboard ---
router.get('/all', async (req, res) => {
  try {
    // We JOIN with the users table to see the name of the person who reported it
    const allReports = await pool.query(
      `SELECT reports.*, users.name as reporter_name 
       FROM reports 
       JOIN users ON reports.user_id = users.id 
       ORDER BY created_at DESC`
    );
    res.json(allReports.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "Error fetching city-wide reports" });
  }
});

module.exports = router;