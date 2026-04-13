import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import mumbaiData from '../assets/mumbai.json';
import naviMumbaiData from '../assets/navimumbai.json';
import 'leaflet/dist/leaflet.css';

const LivabilityScore = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [allScores, setAllScores] = useState({});
  const [loading, setLoading] = useState(false);

  const combinedData = useMemo(() => ({
    type: "FeatureCollection",
    features: [...mumbaiData.features, ...naviMumbaiData.features]
  }), []);

  useEffect(() => {
    fetch('http://localhost:5000/api/livability_all')
      .then(res => res.json())
      .then(data => {
        const scoreMap = {};
        data.forEach(item => { scoreMap[item.area_name] = item.overall_score; });
        setAllScores(scoreMap);
      })
      .catch(err => console.error("Initial load failed", err));
  }, []);

  // --- UPDATED COLOR LOGIC ---
  const getColor = (score) => {
    if (!score) return '#475569'; // SLATE GREY for missing data
    if (score >= 75) return '#22c55e'; // GREEN
    if (score >= 55) return '#eab308'; // YELLOW
    return '#ef4444'; // RED
  };

  // --- UPDATED IDENTIFIER LOGIC ---
 const getIdentifier = (feature) => {
  const p = feature.properties;
  
  // 1. Navi Mumbai Check (Numeric IDs from navimumbai.json)
  if (p.Name && !isNaN(p.Name)) return p.Name;

  // 2. Mumbai Check (Ward Codes or Full Names)
  // Check if properties have an explicit 'abbr' (A, B, etc.)
  if (p.abbr) return p.abbr.toUpperCase().trim();

  // If not, clean the ward_name to get either the code or the name
  const raw = (p.ward_name || p.name || "").toUpperCase().trim();
  
  // Convert "Ward P/North" -> "P/N" or just return "ANDHERI"
  if (raw.includes("NORTH")) return raw.split("/")[0] + "/N";
  if (raw.includes("SOUTH")) return raw.split("/")[0] + "/S";
  if (raw.includes("EAST")) return raw.split("/")[0] + "/E";
  if (raw.includes("WEST")) return raw.split("/")[0] + "/W";
  
  return raw.replace(/WARD\s+/i, ''); 
};

  const zoneStyle = (feature) => {
    const id = getIdentifier(feature);
    const score = allScores[id];
    return {
      fillColor: getColor(score),
      weight: 1.5,
      color: 'white',
      fillOpacity: 0.6
    };
  };

  const onEachArea = (feature, layer) => {
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9, weight: 2.5 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.6, weight: 1.5 }),
      click: async (e) => {
        setLoading(true);
        const id = getIdentifier(feature);
        const label = feature.properties.Name ? `Sector ${feature.properties.Name}` : id;

        try {
          const res = await fetch(`http://localhost:5000/api/livability/${encodeURIComponent(id)}`);
          const data = await res.json();
          setSelectedArea({ displayLabel: label, ...data });
        } catch (err) {
          console.error("Fetch failed", err);
        }
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#050b18] overflow-hidden">
      <div className="flex-1 relative">
        <MapContainer center={[19.06, 73.0]} zoom={11} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <GeoJSON 
            key={Object.keys(allScores).length} 
            data={combinedData} 
            style={zoneStyle} 
            onEachFeature={onEachArea} 
          />
        </MapContainer>
      </div>

      {selectedArea && (
        <div className="w-[400px] bg-slate-950/95 backdrop-blur-3xl p-10 border-l border-white/10 text-white shadow-2xl animate-in slide-in-from-right">
          <h2 className="text-4xl font-black italic uppercase text-blue-400">{selectedArea.displayLabel}</h2>
          <p className="text-slate-500 text-[10px] font-bold tracking-widest mt-2 uppercase">Diagnostic Status: Active</p>
          
          <div className="relative w-52 h-52 mx-auto flex items-center justify-center my-12">
            <svg className="absolute w-full h-full -rotate-90">
              <circle cx="104" cy="104" r="90" stroke="#1e293b" strokeWidth="16" fill="none" />
              <circle cx="104" cy="104" r="90" stroke={getColor(selectedArea.overall_score)} strokeWidth="16" fill="none" 
                      strokeDasharray="565" strokeDashoffset={565 - (565 * (selectedArea.overall_score || 50)) / 100} 
                      className="transition-all duration-1000" />
            </svg>
            <span className="text-8xl font-black italic">{selectedArea.overall_score}</span>
          </div>

          <div className="space-y-6">
            <StatRow label="Safety" val={selectedArea.safety_score} color="bg-blue-500" />
            <StatRow label="Mobility" val={selectedArea.mobility_score} color="bg-emerald-500" />
            <StatRow label="Environment" val={selectedArea.environment_score} color="bg-cyan-500" />
          </div>
          <button onClick={() => setSelectedArea(null)} className="mt-14 w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-bold transition">CLOSE</button>
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, val, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
      <span>{label}</span> <span>{val}%</span>
    </div>
    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${val}%` }}></div>
    </div>
  </div>
);

export default LivabilityScore;