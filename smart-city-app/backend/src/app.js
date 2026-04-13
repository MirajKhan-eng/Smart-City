const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const axios = require('axios'); 
const pool = require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. GEOLOCATION HELPERS
// ==========================================

// Helper: Get real Lat/Lon using OpenStreetMap (Free Geocoding)
async function getCoords(address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Mumbai")}&limit=1`;
        const response = await axios.get(url, { 
            headers: { 'User-Agent': 'SmartCityProject/1.0' } 
        });
        
        if (response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding Error:", error.message);
        return null;
    }
}

// Helper: Haversine formula for distance in KM
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 1.35; // Multiplier for real-world road path curves
}

// ==========================================
// 2. SMART AUTHENTICATION
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

        const user = result.rows[0];
        const isMatch = user.password.startsWith('$2') 
            ? await bcrypt.compare(password, user.password) 
            : (password === user.password);

        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        res.json({
            token: "dummy-jwt-token",
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server login error" });
    }
});

// ==========================================
// 3. LIVABILITY ROUTES
// ==========================================
app.get('/api/livability_all', async (req, res) => {
    try {
        const result = await pool.query('SELECT area_name, overall_score FROM livability_data');
        res.json(result.rows);
    } catch (err) {
        res.status(200).json([]);
    }
});

app.get('/api/livability/:name(*)', async (req, res) => {
    const id = req.params.name.trim();
    try {
        const result = await pool.query('SELECT * FROM livability_data WHERE area_name = $1', [id]);
        if (result.rows.length > 0) return res.json(result.rows[0]);
        res.json({ area_name: id, safety_score: 50, mobility_score: 50, environment_score: 50, overall_score: 50 });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 4. DYNAMIC TRANSPORTATION (RTO FARES & SMART TAGS)
// ==========================================
app.post('/api/transport/calculate', async (req, res) => {
    const { from, to, purpose } = req.body;

    try {
        const startCoords = await getCoords(from);
        const endCoords = await getCoords(to);

        if (!startCoords || !endCoords) {
            return res.status(404).json({ error: "Location not found." });
        }

        const distance = calculateDistance(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
        const now = new Date();
        const hour = now.getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);

        // Fares & Times Logic
        const trainFareVal = distance > 35 ? 20 : (distance > 15 ? 15 : 10);
        const busFareVal = distance > 15 ? 25 : (distance > 10 ? 20 : (distance > 5 ? 15 : 10));
        const autoFareVal = Math.round(26 + (Math.max(0, distance - 1.5) * 17.14));

        const trainTimeVal = Math.round((distance / 35) * 60 + 12);
        const busTimeVal = Math.round((distance / 16) * 60 * (isPeak ? 1.8 : 1.1));
        const autoTimeVal = Math.round((distance / 22) * 60 * (isPeak ? 1.4 : 1));

        let rawOptions = [
            { mode: 'Train', info: `Station nearest to ${from}`, time: trainTimeVal, fare: trainFareVal, comfort: 2 },
            { mode: 'Bus', info: `Available via BEST/NMMT network`, time: busTimeVal, fare: busFareVal, comfort: 1 },
            { mode: 'Auto/Cab', info: "Door-to-door service", time: autoTimeVal, fare: autoFareVal, comfort: 3 }
        ];

        // Dynamic Tagging
        const minFare = Math.min(...rawOptions.map(o => o.fare));
        const minTime = Math.min(...rawOptions.map(o => o.time));
        const maxComfort = Math.max(...rawOptions.map(o => o.comfort));

        const finalOptions = rawOptions.map(opt => {
            let tags = [];
            if (opt.fare === minFare) tags.push("Cheapest");
            if (opt.time === minTime) tags.push("Fastest");
            if (opt.comfort === maxComfort) tags.push("Comfortable");

            return {
                mode: opt.mode,
                info: opt.info,
                time: opt.time,
                fare: `₹${opt.fare}`,
                crowd: opt.mode === 'Auto/Cab' ? 'Low' : (isPeak ? 'Heavy' : 'Moderate'),
                tag: tags[0] || "Standard"
            };
        });

        res.json({
            distance: `${distance.toFixed(1)} km`,
            options: finalOptions,
            recommendation: { 
                text: isPeak ? "Heavy traffic. Local Trains are highly recommended." : "Auto is best for comfort.",
                option: isPeak ? "Train" : "Auto"
            },
            alerts: [{ id: 1, title: "Commuter Alert", msg: "Harbour Line running normally.", type: "warning" }]
        });
    } catch (err) {
        res.status(500).json({ error: "Transport calculation failed." });
    }
});

// ==========================================
// 5. CIVIC REPORTING: SUBMIT (FIXED FOR INT)
// ==========================================
app.post('/api/reports/submit', async (req, res) => {
    const { user_id, title, description, category, location } = req.body;

    try {
        const userIdInt = parseInt(user_id);
        if (isNaN(userIdInt)) return res.status(400).json({ message: "Invalid User ID." });

        const query = `
            INSERT INTO reports (user_id, type, description, location, status, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *;
        `;
        
        const values = [userIdInt, category, `${title}: ${description}`, location, 'Pending'];
        const result = await pool.query(query, values);
        res.status(201).json({ message: "Report filed successfully", report: result.rows[0] });

    } catch (err) {
        console.error("❌ DATABASE ERROR (SUBMIT):", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

// ==========================================
// 6. ADMIN: FETCH ALL REPORTS (FIXED 404)
// ==========================================
app.get('/api/reports/all', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.name as user_name 
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ DATABASE ERROR (FETCH ALL):", err.message);
        res.status(500).json({ error: "Failed to fetch reports." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart City API Active on port ${PORT}`));