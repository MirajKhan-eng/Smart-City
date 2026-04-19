const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: "postgresql://postgres.qhrnoikgymuipjkbbuky:Smartcity2026!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

const nodes = [
    { name: 'Digha', s: 65, m: 60, e: 55 },
    { name: 'Airoli', s: 80, m: 75, e: 70 },
    { name: 'Ghansoli', s: 75, m: 70, e: 65 },
    { name: 'Koparkhairane', s: 78, m: 72, e: 68 },
    { name: 'Vashi', s: 85, m: 80, e: 75 },
    { name: 'Sanpada', s: 82, m: 78, e: 72 },
    { name: 'Nerul', s: 88, m: 82, e: 80 },
    { name: 'Belapur', s: 84, m: 75, e: 85 },
    { name: 'Kharghar', s: 86, m: 70, e: 88 },
    { name: 'Ulwe', s: 70, m: 60, e: 75 },
    { name: 'Panvel', s: 75, m: 65, e: 70 }
];

async function seed() {
    try {
        for (const node of nodes) {
            const overall = Math.round((node.s + node.m + node.e) / 3);
            await pool.query(
                `INSERT INTO livability_data (area_name, safety_score, mobility_score, environment_score, overall_score) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (area_name) DO UPDATE 
                 SET safety_score = $2, mobility_score = $3, environment_score = $4, overall_score = $5`,
                [node.name, node.s, node.m, node.e, overall]
            );
            console.log(`Updated Node: ${node.name}`);
        }
        console.log("Migration Complete!");
    } catch (err) {
        console.error("Migration Error:", err.message);
    } finally {
        await pool.end();
    }
}

seed();
