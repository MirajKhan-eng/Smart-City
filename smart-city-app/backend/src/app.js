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
            const res = await axios.get(url, { headers: { 'User-Agent': 'SmartCityProject/1.0' } });
            return res.data.length > 0 ? { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) } : null;
        };
        let coords = await fetch(address);
        if (coords) return coords;
        const parts = address.split(',').map(p => p.trim());
        for (let i = 0; i < parts.length - 1; i++) {
            const subAddress = parts.slice(i + 1).join(', ');
            if (subAddress.length < 5) break;
            coords = await fetch(subAddress);
            if (coords) return coords;
        }
        if (parts.length > 0) return await fetch(parts[0]);
        return null;
    } catch (error) { return null; }
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
    const { email, password, portalType } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        const user = result.rows[0];

        // Strict Portal Validation
        if (portalType === 'official' && user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: This portal is for authorized officials only." });
        }
        if (portalType === 'citizen' && user.role === 'admin') {
            return res.status(403).json({ message: "Access Denied: Officials must use the Official Portal." });
        }

        const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (password === user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
        
        res.json({ 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role || 'citizen',
                dept_id: user.dept_id 
            } 
        });
    } catch (err) { res.status(500).json({ error: "Login error" }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, deptId } = req.body;
    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ message: "User already exists" });
        
        // Format check if role is admin
        if (role === 'admin' && deptId) {
            const formatRegex = /^MUM-\d{4}-[A-Z]+$/;
            if (!formatRegex.test(deptId)) return res.status(400).json({ message: "Invalid Department ID Format" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, dept_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, dept_id', 
            [name, email, hashedPassword, role || 'citizen', deptId || null]
        );
        res.status(201).json({ user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Register error" }); }
});

// ==========================================
// 3. TRANSPORTATION & SMART ROUTING
// ==========================================

app.get('/api/transport/test', (req, res) => res.json({ status: "Route Active" }));

app.post('/api/transport/calculate', async (req, res) => {
    const { from, to } = req.body;
    try {
        const startCoords = await getCoords(from);
        const endCoords = await getCoords(to);
        if (!startCoords || !endCoords) return res.json({ success: false, error: "Location not found" });
        const distance = calculateDistance(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
        const startLoc = from.split(',')[0].trim();
        const nearestStation = startLoc;
        const busNumbers = ["C-103", "A-205", "302", "501-LTD"].slice(0, Math.ceil(Math.random() * 3)).join(", ");
        res.json({
            distance: `${distance.toFixed(1)} km`,
            coords: { start: startCoords, end: endCoords },
            options: [
                { mode: 'Train', time: Math.round((distance/35)*60+12), fare: `₹20`, tag: 'Fastest', carbon: (distance*0.01).toFixed(2), instruction: `Catch Local from: ${nearestStation} Station`, crowd: isPeak ? 'Heavy' : 'Moderate' },
                { mode: 'Bus', time: Math.round((distance/16)*60+15), fare: '₹20', tag: 'Cheapest', carbon: (distance*0.03).toFixed(2), instruction: `Bus Nos: ${busNumbers} (BEST/NMMT)`, crowd: isPeak ? 'Full' : 'Moderate' },
                { mode: 'Auto/Cab', time: Math.round((distance/22)*60+10), fare: `₹${Math.round(26+distance*17)}`, tag: 'Comfort', carbon: (distance*0.12).toFixed(2), instruction: 'Door-to-door pickup', crowd: 'Low' }
            ]
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
// 5. COMMUNITY REPORTS & TRACKING
// ==========================================

app.get('/api/reports/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT r.*, u.name as reporter_name FROM reports r LEFT JOIN users u ON r.user_id = u.id ORDER BY CASE WHEN r.priority = \'High\' THEN 1 WHEN r.priority = \'Medium\' THEN 2 ELSE 3 END, r.created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Fetch Error" }); }
});

app.get('/api/reports/my-votes/:userId', async (req, res) => {
    try {
        const result = await pool.query('SELECT report_id FROM report_votes WHERE user_id = $1', [req.params.userId]);
        res.json(result.rows.map(r => r.report_id));
    } catch (err) { res.status(500).json({ error: "Votes Fetch Error" }); }
});

app.post('/api/reports/:id/vote', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
        const check = await pool.query('SELECT * FROM report_votes WHERE report_id = $1 AND user_id = $2', [id, user_id]);
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM report_votes WHERE report_id = $1 AND user_id = $2', [id, user_id]);
            await pool.query('UPDATE reports SET votes = GREATEST(0, votes - 1) WHERE id = $1', [id]);
            return res.json({ voted: false });
        } else {
            await pool.query('INSERT INTO report_votes (report_id, user_id) VALUES ($1, $2)', [id, user_id]);
            await pool.query('UPDATE reports SET votes = COALESCE(votes, 0) + 1 WHERE id = $1', [id]);
            return res.json({ voted: true });
        }
    } catch (err) { res.status(500).json({ error: "Vote Error" }); }
});

app.post('/api/reports/submit', async (req, res) => {
    const { user_id, title, description, category, location, image_url } = req.body;
    try {
        let dept = 'PWD';
        const type = category.toLowerCase();
        if (type.includes('waste') || type.includes('garbage')) dept = 'Waste';
        else if (type.includes('environment') || type.includes('tree')) dept = 'Environment';
        else if (type.includes('traffic') || type.includes('police')) dept = 'Traffic';
        else if (type.includes('water') || type.includes('leak')) dept = 'Water';

        const query = 'INSERT INTO reports (user_id, title, type, description, location, image_url, votes, status, department, tracking_step, priority) VALUES ($1, $2, $3, $4, $5, $6, 0, \'Pending\', $7, 1, \'Medium\') RETURNING *';
        const result = await pool.query(query, [user_id, title, category, description, location, image_url, dept]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Submit error" }); }
});

app.put('/api/admin/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_message, tracking_step, priority, department } = req.body;
    try {
        const query = `
            UPDATE reports 
            SET status = COALESCE($1, status), 
                admin_message = COALESCE($2, admin_message), 
                tracking_step = COALESCE($3, tracking_step),
                priority = COALESCE($4, priority),
                department = COALESCE($5, department)
            WHERE id = $6 RETURNING *
        `;
        const result = await pool.query(query, [status, admin_message, tracking_step, priority, department, id]);
        res.json(result.rows[0]);
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
        const result = await pool.query('SELECT department, status FROM reports');
        const analytics = {
            total: result.rows.length,
            resolved: result.rows.filter(r => r.status === 'Resolved').length,
            pending: result.rows.filter(r => r.status === 'Pending').length,
            departments: { PWD: 0, Waste: 0, Environment: 0, Traffic: 0, Water: 0 }
        };
        result.rows.forEach(r => { if (analytics.departments[r.department] !== undefined) analytics.departments[r.department]++; });
        res.json(analytics);
    } catch (err) { res.status(500).json({ error: "Analytics error" }); }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { guardian_name, guardian_phone } = req.body;
    try {
        const query = 'UPDATE users SET guardian_name = $1, guardian_phone = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(query, [guardian_name, guardian_phone, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Update Error" }); }
});

app.put('/api/admin/dispatch/:id', async (req, res) => {
    const { id } = req.params;
    const { type, eta, unit_location } = req.body;
    try {
        const query = 'UPDATE reports SET dispatch_type = $1, eta = $2, unit_location = $3, status = \'In Progress\', tracking_step = 4 WHERE id = $4 RETURNING *';
        const result = await pool.query(query, [type, eta, unit_location, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Dispatch Update Error" }); }
});

app.post('/api/emergency/sos', async (req, res) => {
    const { user_id, location } = req.body;
    try {
        console.log(`🚨 SOS ALERT: User ${user_id} at ${location.lat}, ${location.lng}`);
        // Log to reports table as a high-priority 'Emergency' type
        const query = 'INSERT INTO reports (user_id, title, type, description, location, status, priority, tracking_step, department) VALUES ($1, \'SOS ALERT\', \'Emergency\', \'Panic button triggered via mobile app.\', $2, \'In Progress\', \'High\', 3, \'Traffic\') RETURNING *';
        const locString = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        const result = await pool.query(query, [user_id, locString]);
        res.json({ 
            success: true, 
            message: "Emergency services notified", 
            report: result.rows[0] 
        });
    } catch (err) { res.status(500).json({ error: "SOS Log Error" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart City API active on port ${PORT}`));