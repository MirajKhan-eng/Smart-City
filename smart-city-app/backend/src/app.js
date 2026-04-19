const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 1. GEOLOCATION & DISTANCE HELPERS
// ==========================================

async function getCoords(address) {
    try {
        const fetch = async (q) => {
            const cleanQ = q.replace(/(Unit|Plot|Room|Flat|Shop|Floor|Building|Bldg|House|HNo)[\s\d/-]+/gi, '').trim();
            const suffix = cleanQ.toLowerCase().includes("mumbai") ? "" : ", Mumbai, Maharashtra";
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ + suffix)}&limit=1`;
            console.log("-> Geocoding Attempt:", cleanQ);
            const res = await axios.get(url, { headers: { 'User-Agent': 'SmartCityProject/1.0' } });
            return res.data.length > 0 ? { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) } : null;
        };

        // 1. Try full address
        let coords = await fetch(address);
        if (coords) return coords;

        // 2. Progressive reduction fallback
        const parts = address.split(',').map(p => p.trim());
        for (let i = 0; i < parts.length - 1; i++) {
            // Try removing the most specific parts (left side) one by one
            const subAddress = parts.slice(i + 1).join(', ');
            if (subAddress.length < 5) break;
            coords = await fetch(subAddress);
            if (coords) return coords;
        }

        // 3. Last resort: Try the very first part if it's a known landmark name
        if (parts.length > 0) return await fetch(parts[0]);

        return null;
    } catch (error) { console.error("Geocoding Error:", error.message); return null; }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1.35;
}

// ==========================================
// 2. AUTHENTICATION
// ==========================================

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        const user = result.rows[0];
        const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (password === user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'citizen' } });
    } catch (err) { res.status(500).json({ error: "Login error" }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role', [name, email, hashedPassword, role || 'citizen']);
        res.status(201).json({ user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Register error" }); }
});

// ==========================================
// 3. TRANSPORTATION & SMART ROUTING
// ==========================================

app.get('/api/transport/test', (req, res) => res.json({ status: "Route Active" }));

app.post('/api/transport/calculate', async (req, res) => {
    console.log("-> Transport Request:", req.body.from, "to", req.body.to);
    const { from, to, purpose } = req.body;
    try {
        const startCoords = await getCoords(from);
        const endCoords = await getCoords(to);
        
        if (!startCoords || !endCoords) {
            return res.json({ success: false, error: "One or more locations could not be verified in Mumbai region." });
        }

        const distance = calculateDistance(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);

        // --- DYNAMIC TRANSIT GUIDANCE LOGIC ---
        const extractLocality = (addr) => {
            const parts = addr.split(',');
            // Extract the first meaningful landmark or locality name
            return parts[0].trim().replace(/(Unit|Plot|Room|Flat|Shop|Floor|Building|Bldg|House|HNo)[\s\d/-]+/gi, '').trim();
        };
        const startLoc = extractLocality(from);
        
        // Mocking station/bus data based on locality (In a real app, this would query a transit DB)
        const nearestStation = startLoc;
        const busNumbers = ["C-103", "A-205", "302", "501-LTD", "AS-524"].slice(0, Math.ceil(Math.random() * 3)).join(", ");

        const hazards = await pool.query("SELECT title, description FROM reports WHERE status != 'Resolved' AND (location ILIKE $1 OR location ILIKE $2) LIMIT 2", [`%${from}%`, `%${to}%`]);
        let trafficPenalty = hazards.rows.length * 12 + (isPeak ? 15 : 0);

        const trainFare = distance > 15 ? 15 : 10;
        const autoFare = Math.round((26 + (Math.max(0, distance - 1.5) * 17.14)) * (isPeak ? 1.25 : 1.0));
        
        res.json({
            distance: `${distance.toFixed(1)} km`,
            coords: { start: startCoords, end: endCoords },
            options: [
                { 
                    mode: 'Train', 
                    time: Math.round((distance/35)*60+12), 
                    fare: `₹${trainFare}`, 
                    tag: 'Fastest', 
                    carbon: (distance*0.01).toFixed(2), 
                    info: `Local train from ${nearestStation} Stn.`, 
                    instruction: `Catch Local from: ${nearestStation} Station`,
                    crowd: isPeak ? 'Heavy' : 'Moderate' 
                },
                { 
                    mode: 'Bus', 
                    time: Math.round((distance/16)*60+trafficPenalty), 
                    fare: '₹20', 
                    tag: 'Cheapest', 
                    carbon: (distance*0.03).toFixed(2), 
                    info: `Available: ${busNumbers}`, 
                    instruction: `Bus Nos: ${busNumbers} (BEST/NMMT)`,
                    crowd: isPeak ? 'Full' : 'Moderate' 
                },
                { 
                    mode: 'Auto/Cab', 
                    time: Math.round((distance/22)*60+trafficPenalty), 
                    fare: `₹${autoFare}`, 
                    tag: 'Comfort', 
                    carbon: (distance*0.12).toFixed(2), 
                    info: 'Point-to-Point Service', 
                    instruction: 'Door-to-door pickup (No transit walk)',
                    crowd: 'Low' 
                }
            ],
            recommendation: { text: hazards.rows.length > 0 ? `Caution: ${hazards.rows[0].title} reported nearby.` : (isPeak ? "Peak hours. Use trains." : "Smooth flow."), isAlert: hazards.rows.length > 0 },
            alerts: hazards.rows.map(h => ({ id: Math.random(), title: "Live Report", msg: h.title, type: "danger" }))
        });
    } catch (err) { res.status(500).json({ error: "Calculation error" }); }
});

// ==========================================
// 4. LIVABILITY & CITY ANALYTICS
// ==========================================

app.get('/api/livability_all', async (req, res) => {
    try {
        const result = await pool.query('SELECT area_name, overall_score, safety_score, mobility_score, environment_score FROM livability_data');
        res.json(result.rows);
    } catch (err) { res.json([]); }
});

app.get('/api/livability/:name(*)', async (req, res) => {
    const id = req.params.name.trim();
    try {
        const result = await pool.query('SELECT * FROM livability_data WHERE area_name ILIKE $1', [id]);
        let data = result.rows.length > 0 ? result.rows[0] : { area_name: id, safety_score: 65, mobility_score: 60, environment_score: 70 };
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
        if (isPeak) data.mobility_score = Math.max(20, data.mobility_score - 15);
        data.overall_score = Math.round((data.safety_score + data.mobility_score + data.environment_score) / 3);
        res.json(data);
    } catch (err) { res.status(500).json({ error: "Liva Error" }); }
});

// ==========================================
// 5. COMMUNITY REPORTS & ADMIN
// ==========================================

app.get('/api/reports/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT r.*, u.name as reporter_name FROM reports r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Fetch Error" }); }
});

app.post('/api/reports/submit', async (req, res) => {
    const { user_id, title, description, category, location, image_url } = req.body;
    try {
        const query = 'INSERT INTO reports (user_id, title, type, description, location, image_url, votes, status) VALUES ($1, $2, $3, $4, $5, $6, 0, \'Pending\') RETURNING *';
        const result = await pool.query(query, [user_id, title, category, description, location, image_url]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Submit error" }); }
});

app.put('/api/admin/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_message } = req.body;
    try {
        await pool.query('UPDATE reports SET status = $1, admin_message = $2 WHERE id = $3', [status, admin_message, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Update error" }); }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete error" }); }
});

app.get('/api/admin/analytics', async (req, res) => {
    try {
        const result = await pool.query('SELECT status FROM reports');
        res.json({ total: result.rows.length, resolved: result.rows.filter(r => r.status === 'Resolved').length, departments: { PWD: 5, Waste: 3, Traffic: 2 } });
    } catch (err) { res.status(500).json({ error: "Analytics error" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart City API active on port ${PORT}`));