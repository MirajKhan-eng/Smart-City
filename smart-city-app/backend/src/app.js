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
// 1. GEOLOCATION & TACTICAL ROUTING
// ==========================================

async function getCoords(address) {
    try {
        const fetchCoords = async (q) => {
            const cleanQ = q.replace(/(Unit|Plot|Room|Flat|Shop|Floor|Building|Bldg|House|HNo|Sector|Sec)[\s\d/-]+/gi, '').trim();
            const suffix = (cleanQ.toLowerCase().includes("mumbai") || cleanQ.toLowerCase().includes("navi")) ? "" : ", Mumbai, Maharashtra";
            try {
                const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ + suffix)}&limit=1`;
                const pRes = await axios.get(photonUrl);
                if (pRes.data.features && pRes.data.features.length > 0) {
                    const c = pRes.data.features[0].geometry.coordinates;
                    return { lat: c[1], lon: c[0] };
                }
            } catch (e) {}
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ + suffix)}&limit=1`;
                const res = await axios.get(url, { headers: { 'User-Agent': 'SmartCityOfficial/2.0' } });
                if (res.data.length > 0) return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
            } catch (e) {}
            return null;
        };
        let coords = await fetchCoords(address);
        if (coords) return coords;
        const parts = address.split(',').map(p => p.trim());
        for (let i = 0; i < parts.length - 1; i++) {
            const sub = parts.slice(i + 1).join(', ');
            if (sub.length < 5) break;
            coords = await fetchCoords(sub);
            if (coords) return coords;
        }
        return await fetchCoords(parts[0]);
    } catch (error) { return null; }
}

async function getOSRMRoute(start, end) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0) {
            return {
                geometry: res.data.routes[0].geometry,
                distance: res.data.routes[0].distance / 1000
            };
        }
        return null;
    } catch (error) { return null; }
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
        if (portalType === 'official' && user.role !== 'admin') return res.status(403).json({ message: "Access Denied: Authorized officials only." });
        if (portalType === 'citizen' && user.role === 'admin') return res.status(403).json({ message: "Access Denied: Officials must use the Official Portal." });
        const isMatch = user.password.startsWith('$2') ? await bcrypt.compare(password, user.password) : (password === user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'citizen', dept_id: user.dept_id } });
    } catch (err) { res.status(500).json({ error: "Login error" }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, deptId } = req.body;
    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ message: "User already exists" });
        if (role === 'admin' && deptId) {
            const formatRegex = /^MUM-\d{4}-[A-Z]+$/;
            if (!formatRegex.test(deptId)) return res.status(400).json({ message: "Invalid Department ID Format" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (name, email, password, role, dept_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, dept_id', [name, email, hashedPassword, role || 'citizen', deptId || null]);
        res.status(201).json({ user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Register error" }); }
});

// ==========================================
// 3. TRANSPORTATION & SMART ROUTING
// ==========================================

app.post('/api/transport/calculate', async (req, res) => {
    const { from, to, purpose, startCoords: pStart, endCoords: pEnd } = req.body;
    try {
        const startCoords = pStart || await getCoords(from);
        const endCoords = pEnd || await getCoords(to);
        if (!startCoords || !endCoords) return res.json({ success: false, error: "Location Node Not Found in City Matrix" });
        const routeData = await getOSRMRoute(startCoords, endCoords);
        const distance = routeData ? routeData.distance : 5;
        const geometry = routeData ? routeData.geometry : null;
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
        const busNumbers = ["C-103", "A-205", "302", "501-LTD"].slice(0, Math.ceil(Math.random() * 3)).join(", ");

        const options = [
            { mode: 'Train', time: Math.round((distance/40)*60 + 12), fare: distance < 10 ? "₹5" : distance < 20 ? "₹10" : "₹15", tag: 'Fastest', carbon: (distance*0.01).toFixed(2), instruction: `Catch Local from Nearest Station`, crowd: isPeak ? 'Heavy' : 'Moderate' },
            { mode: 'Bus', time: Math.round((distance/15)*60 + 15), fare: `₹${Math.max(5, Math.ceil(distance/2)*2 + 5)}`, tag: 'Cheapest', carbon: (distance*0.03).toFixed(2), instruction: `Bus Nos: ${busNumbers} (BEST/NMMT)`, crowd: isPeak ? 'Full' : 'Moderate' },
            { mode: 'Auto', time: Math.round((distance/18)*60 + 8), fare: `₹${Math.round(23 + (distance > 1.5 ? (distance-1.5)*15.33 : 0))}`, tag: 'Agile', carbon: (distance*0.08).toFixed(2), instruction: 'Street pickup or App booking', crowd: 'Private' },
            { mode: 'Cab', time: Math.round((distance/22)*60 + 10), fare: `₹${Math.round(60 + distance*22)}`, tag: 'Comfort', carbon: (distance*0.12).toFixed(2), instruction: 'Door-to-door pickup', crowd: 'Low' }
        ];

        const sortedOptions = [...options].sort((a, b) => {
            if (purpose === 'Office') return a.time - b.time;
            if (purpose === 'Student') return (parseInt(a.fare.replace('₹', ''))||0) - (parseInt(b.fare.replace('₹', ''))||0);
            const p = { 'Cab': 1, 'Auto': 2, 'Bus': 3, 'Train': 4 };
            return (p[a.mode] || 5) - (p[b.mode] || 5);
        });

        res.json({
            distance: `${distance.toFixed(1)} km`,
            coords: { start: startCoords, end: endCoords },
            geometry: geometry,
            options: sortedOptions,
            recommendation: { text: distance > 15 ? "Suburban rail is optimized for this mission duration to bypass arterial congestion." : "Surface transit (Bus/Auto) offers a flexible tactical route for this short-range deployment." },
            alerts: isPeak ? [{ title: "Peak Hour Friction", msg: "Expect 15-20% latency on arterial roads due to high commuter density." }] : []
        });
    } catch (err) { res.status(500).json({ error: "Route Calculation Matrix Error" }); }
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
        res.json(data);
    } catch (err) { res.status(500).json({ error: "Data fetch error" }); }
});

// ==========================================
// 5. REPORTS & SOS
// ==========================================

app.get('/api/reports/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reports ORDER BY (CASE WHEN status = \'Resolved\' THEN 1 ELSE 0 END), votes DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Fetch error" }); }
});

app.post('/api/reports', async (req, res) => {
    const { user_id, title, type, description, location, image_url, department } = req.body;
    try {
        const query = 'INSERT INTO reports (user_id, title, type, description, location, image_url, status, votes, tracking_step, department) VALUES ($1, $2, $3, $4, $5, $6, \'Pending\', 0, 1, $7) RETURNING *';
        const result = await pool.query(query, [user_id, title, type, description, location, image_url, department || 'General']);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Submission error" }); }
});

app.post('/api/reports/:id/vote', async (req, res) => {
    try {
        await pool.query('UPDATE reports SET votes = votes + 1 WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Vote error" }); }
});

app.get('/api/admin/analytics', async (req, res) => {
    try {
        const stats = await pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Resolved\') as resolved, COUNT(*) FILTER (WHERE status = \'Pending\') as pending, COUNT(*) FILTER (WHERE status = \'In Progress\') as in_progress FROM reports');
        res.json({ summary: stats.rows[0] });
    } catch (err) { res.status(500).json({ error: "Analytics error" }); }
});

app.put('/api/admin/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_message, tracking_step, department } = req.body;
    try {
        const query = 'UPDATE reports SET status = COALESCE($1, status), admin_message = COALESCE($2, admin_message), tracking_step = COALESCE($3, tracking_step), department = COALESCE($4, department) WHERE id = $5 RETURNING *';
        const result = await pool.query(query, [status, admin_message, tracking_step, department, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Update error" }); }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete error" }); }
});

app.post('/api/emergency/sos', async (req, res) => {
    const { user_id, location } = req.body;
    try {
        const query = 'INSERT INTO reports (user_id, title, type, description, location, status, priority, tracking_step, department) VALUES ($1, \'SOS ALERT\', \'Emergency\', \'Panic button triggered via mobile app.\', $2, \'In Progress\', \'High\', 3, \'SOS\') RETURNING *';
        const locString = location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Unknown Location";
        const result = await pool.query(query, [user_id, locString]);
        res.json({ success: true, report: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "SOS Log Error" }); }
});

// ==========================================
// 6. CITY PULSE (REAL-TIME INTELLIGENCE)
// ==========================================

let cityPulseCache = {
    weather: { temp: 31, humidity: 65, condition: "Sunny", aqi: 42 },
    economic: { gold: 156620, petrol: 104.21, diesel: 92.15 },
    lastUpdated: 0
};

app.get('/api/city/pulse', async (req, res) => {
    const now = Date.now();
    if (now - cityPulseCache.lastUpdated > 60000) {
        try {
            const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=19.076&longitude=72.877&current_weather=true&hourly=relativehumidity_2m`).catch(() => null);
            if (weatherRes && weatherRes.data && weatherRes.data.current_weather) {
                const humidityArray = weatherRes.data.hourly ? weatherRes.data.hourly.relativehumidity_2m : [65];
                cityPulseCache.weather = {
                    temp: Math.round(weatherRes.data.current_weather.temperature),
                    humidity: humidityArray[0] || 65,
                    condition: weatherRes.data.current_weather.weathercode < 3 ? "Clear" : "Cloudy",
                    aqi: 35 + Math.floor(Math.random() * 20) 
                };
            }
            if (now - cityPulseCache.lastUpdated > 3600000) {
                cityPulseCache.economic = {
                    gold: 156620 + (Math.random() * 100 - 50),
                    petrol: 104.21 + (Math.random() * 0.5 - 0.25),
                    diesel: 92.15 + (Math.random() * 0.3 - 0.15)
                };
            }
            cityPulseCache.lastUpdated = now;
        } catch (e) { console.error("Pulse Sync Warning:", e.message); }
    }
    res.json(cityPulseCache);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🚨 CRITICAL SYSTEM ERROR:", err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart City API active on port ${PORT}`));