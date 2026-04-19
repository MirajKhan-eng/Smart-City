const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

// Limit handling for screenshots and community images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 1. GEOLOCATION & DISTANCE HELPERS (Restored)
// ==========================================

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

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 1.35; // Real-world road multiplier
}

// ==========================================
// 2. SMART AUTHENTICATION (Synced)
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'citizen' }
        });
    } catch (err) {
        res.status(500).json({ error: "Server login error" });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if user exists
        const checkUser = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'citizen']
        );
        res.status(201).json({ user: result.rows[0], message: "User registered successfully" });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ error: "Server registration error" });
    }
});

// ==========================================
// 3. LIVABILITY ROUTES (Restored)
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
// 4. TRANSPORTATION CALCULATOR (Restored)
// ==========================================

app.post('/api/transport/calculate', async (req, res) => {
    const { from, to, purpose } = req.body;
    try {
        const startCoords = await getCoords(from);
        const endCoords = await getCoords(to);

        if (!startCoords || !endCoords) {
            return res.status(404).json({ error: "Location not found in Mumbai region." });
        }

        const distance = calculateDistance(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);

        // Logic for Fares
        const trainFare = distance > 35 ? 20 : (distance > 15 ? 15 : 10);
        const autoFare = Math.round(26 + (Math.max(0, distance - 1.5) * 17.14));
        const busFare = distance > 10 ? 25 : 15;

        // Logic for Times
        const trainTime = Math.round((distance / 35) * 60 + 12);
        const autoTime = Math.round((distance / 22) * 60 * (isPeak ? 1.4 : 1));
        const busTime = Math.round((distance / 16) * 60 * (isPeak ? 1.8 : 1.1));

        res.json({
            distance: `${distance.toFixed(1)} km`,
            options: [
                { 
                    mode: 'Train', 
                    time: trainTime, 
                    fare: `₹${trainFare}`, 
                    tag: 'Fastest', 
                    info: `Nearest station to ${from}`, 
                    crowd: isPeak ? 'Heavy' : 'Moderate' 
                },
                { 
                    mode: 'Bus', 
                    time: busTime, 
                    fare: `₹${busFare}`, 
                    tag: 'Cheapest', 
                    info: 'BEST/NMMT Bus Frequency: 15 mins', 
                    crowd: isPeak ? 'Full' : 'Moderate' 
                },
                { 
                    mode: 'Auto/Cab', 
                    time: autoTime, 
                    fare: `₹${autoFare}`, 
                    tag: 'Comfort', 
                    info: 'Door-to-door pickup available', 
                    crowd: 'Low' 
                }
            ],
            recommendation: {
                text: isPeak 
                    ? "Peak hours detected. Local trains are 40% faster than road travel currently." 
                    : "Traffic is light. Auto-rickshaw or Cab is recommended for a comfortable journey.",
                option: isPeak ? "Train" : "Auto/Cab"
            },
            alerts: [
                { id: 1, title: "Weather", msg: "Clear skies. No transport delays reported.", type: "info" },
                { id: 2, title: "Traffic", msg: isPeak ? "Heavy congestion on Main Highway." : "Smooth flow on most arterial roads.", type: "warning" }
            ]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal calculation error." });
    }
});

// ==========================================
// 5. COMMUNITY FEED & REPORTING (Synced with Photo Support)
// ==========================================

app.get('/api/reports/all', async (req, res) => {
    const { filter } = req.query;
    try {
        let orderBy = 'r.created_at DESC';
        if (filter === 'trending') orderBy = 'r.votes DESC, r.created_at DESC';
        const query = `
            SELECT r.*, u.name as reporter_name 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY 
                CASE WHEN LOWER(r.status) = 'resolved' THEN 1 ELSE 0 END ASC,
                r.votes DESC, 
                r.created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Fetch Error" }); }
});

app.post('/api/reports/submit', async (req, res) => {
    const { user_id, title, description, category, location, image_url } = req.body;
    try {
        const uId = parseInt(user_id);
        const finalImage = (image_url && image_url.trim() !== "") ? image_url : null;
        
        const query = `
            INSERT INTO reports (user_id, title, type, description, location, image_url, votes, status, priority) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', 'Medium') 
            RETURNING *;
        `;
        const result = await pool.query(query, [uId, title, category, description, location, finalImage, 0]);
        console.log("New Report Saved:", title);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("DB Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reports/:id/vote', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
        const rId = parseInt(id);
        const uId = parseInt(user_id);
        const check = await pool.query('SELECT * FROM report_votes WHERE report_id = $1 AND user_id = $2', [rId, uId]);
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM report_votes WHERE report_id = $1 AND user_id = $2', [rId, uId]);
            await pool.query('UPDATE reports SET votes = GREATEST(0, COALESCE(votes, 1) - 1) WHERE id = $1', [rId]);
            return res.json({ action: 'unliked' });
        }
        await pool.query('INSERT INTO report_votes (report_id, user_id) VALUES ($1, $2)', [rId, uId]);
        await pool.query('UPDATE reports SET votes = COALESCE(votes, 0) + 1 WHERE id = $1', [rId]);
        res.json({ action: 'liked' });
    } catch (err) { res.status(500).json({ error: "Vote crash" }); }
});

app.put('/api/admin/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_message, priority } = req.body;
    try {
        const query = `
            UPDATE reports 
            SET status = $1, admin_message = $2, priority = $3 
            WHERE id = $4 
            RETURNING *;
        `;
        const result = await pool.query(query, [status, admin_message, priority, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Report not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Admin Update Error:", err.message);
        res.status(500).json({ error: "Server update error" });
    }
});

app.get('/api/reports/my-votes/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query('SELECT report_id FROM report_votes WHERE user_id = $1', [user_id]);
        res.json(result.rows.map(r => r.report_id));
    } catch (err) {
        res.status(500).json({ error: "Fetch Votes Error" });
    }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM report_votes WHERE report_id = $1', [id]);
        const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Report not found" });
        res.json({ message: "Report deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err.message);
        res.status(500).json({ error: "Server delete error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart City Full-Feature API active on port ${PORT}`));