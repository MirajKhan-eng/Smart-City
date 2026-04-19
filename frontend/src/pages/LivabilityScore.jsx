import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import mumbaiData from '../assets/mumbai.json';
import naviMumbaiData from '../assets/navimumbai.json';
import { 
    Navigation, ShieldCheck, Zap, X, Activity, ArrowRight, Building2, GraduationCap, Landmark, Trees, Wallet, GitCompare, ArrowLeftRight
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- HELPERS & DATA ---

const localityMap = {
    'A': ['Colaba', 'Nariman Point'], 'B': ['Dongri', 'Sandhurst Road'], 'C': ['Marine Lines', 'Kalbadevi'],
    'D': ['Malabar Hill', 'Grant Road'], 'E': ['Byculla', 'Mazgaon'], 'F/N': ['Matunga', 'Sion'],
    'F/S': ['Parel', 'Sewri'], 'G/N': ['Dharavi', 'Dadar'], 'G/S': ['Worli', 'Lower Parel'],
    'H/E': ['Santacruz East', 'Bandra East'], 'H/W': ['Bandra West', 'Khar'],
    'K/E': ['Andheri East', 'Jogeshwari'], 'K/W': ['Andheri West', 'Versova'],
    'L': ['Kurla', 'Saki Naka'], 'M/E': ['Govandi', 'Mankhurd'], 'M/W': ['Chembur'],
    'N': ['Ghatkopar', 'Vikhroli'], 'P/N': ['Malad', 'Marve'], 'P/S': ['Goregaon'],
    'R/C': ['Borivali', 'Gorai'], 'R/N': ['Dahisar'], 'R/S': ['Kandivali'],
    'S': ['Bhandup', 'Powai'], 'T': ['Mulund'],
    'Belapur': ['CBD Belapur', 'Sector 15'], 'Nerul': ['Seawoods', 'Sector 40'],
    'Vashi': ['Sagar Vihar', 'APMC'], 'Sanpada': ['Palm Beach Road'],
    'Koparkhairane': ['Sector 14'], 'Ghansoli': ['Sector 3'],
    'Airoli': ['Mindspace'], 'Digha': ['Sathe Nagar'],
    'Kharghar': ['Central Park'], 'Panvel': ['New Panvel'],
    'Ulwe': ['Sector 19'], 'Kamothe': ['Sector 21'],
    'Kalamboli': ['Steel Market'], 'Taloja': ['Phase 1']
};

const getColor = (score) => {
    if (!score) return '#475569';
    if (score >= 75) return '#22c55e';
    if (score >= 55) return '#eab308';
    return '#ef4444';
};

const getIdentifier = (feature) => {
    const p = feature.properties;
    if (p.Name && !isNaN(p.Name)) {
        const n = parseInt(p.Name);
        if (n <= 10) return "DIGHA";
        if (n <= 22) return "AIROLI";
        if (n <= 35) return "GHANSOLI";
        if (n <= 48) return "KOPARKHAIRANE";
        if (n <= 62) return "VASHI";
        if (n <= 75) return "SANPADA";
        if (n <= 90) return "NERUL";
        if (n <= 100) return "BELAPUR";
        if (n <= 105) return "KHARGHAR";
        if (n <= 108) return "ULWE";
        return "PANVEL";
    }
    if (p.abbr) return p.abbr.toUpperCase().trim();
    const raw = (p.ward_name || p.name || "").toUpperCase().trim();
    if (raw.includes("NORTH")) return raw.split("/")[0] + "/N";
    if (raw.includes("SOUTH")) return raw.split("/")[0] + "/S";
    if (raw.includes("EAST")) return raw.split("/")[0] + "/E";
    if (raw.includes("WEST")) return raw.split("/")[0] + "/W";
    return raw.replace(/WARD\s+/i, ''); 
};

// --- COMPONENTS ---

const StatRow = ({ label, val, icon, color, isComparison }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{icon} {label}</span> 
        <span className={`font-black text-white ${isComparison ? 'text-sm' : 'text-xl'}`}>{val}%</span>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${val}%` }}></div>
      </div>
    </div>
);

const AreaSummary = ({ area, onDismiss, onInsights, isComparison }) => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-start mb-6 shrink-0">
            <button onClick={onDismiss} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><X size={20}/></button>
            <div className="text-right">
                <h2 className={`${isComparison ? 'text-2xl' : 'text-4xl'} font-black italic uppercase text-blue-500 leading-none`}>{area.displayLabel}</h2>
                <h3 className={`${isComparison ? 'text-sm' : 'text-xl'} font-black text-white uppercase mt-2`}>{area.locality}</h3>
            </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-4 space-y-8 min-h-0 overflow-y-auto custom-scrollbar">
            <div className={`relative ${isComparison ? 'w-48 h-48' : 'w-64 h-64'} mx-auto flex items-center justify-center shrink-0`}>
                <svg className="absolute w-full h-full -rotate-90">
                    <circle cx={isComparison ? "96" : "128"} cy={isComparison ? "96" : "128"} r={isComparison ? "82" : "110"} stroke="#1e293b" strokeWidth={isComparison ? "14" : "20"} fill="none" />
                    <circle cx={isComparison ? "96" : "128"} cy={isComparison ? "96" : "128"} r={isComparison ? "82" : "110"} stroke={getColor(area.overall_score)} strokeWidth={isComparison ? "14" : "20"} fill="none" 
                            strokeDasharray={isComparison ? "515" : "691"} strokeDashoffset={isComparison ? 515 - (515 * area.overall_score / 100) : 691 - (691 * area.overall_score / 100)} 
                            className="transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <div className="text-center">
                    <span className={`${isComparison ? 'text-6xl' : 'text-8xl'} font-black italic text-white leading-none tracking-tighter`}>{area.overall_score}</span>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">LIVABILITY</p>
                </div>
            </div>

            <div className="space-y-6">
                <StatRow label="Safety" val={area.safety_score} icon={<ShieldCheck className="w-4 h-4 text-blue-400" />} color="bg-blue-500" isComparison={isComparison} />
                <StatRow label="Mobility" val={area.mobility_score} icon={<Zap className="w-4 h-4 text-emerald-400" />} color="bg-emerald-500" isComparison={isComparison} />
                <StatRow label="Environment" val={area.environment_score} icon={<Trees className="w-4 h-4 text-cyan-400" />} color="bg-cyan-500" isComparison={isComparison} />
            </div>
        </div>

        {!isComparison && (
            <button onClick={onInsights} className="mt-8 w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shrink-0">Analytical Matrix <ArrowRight size={16} /></button>
        )}
    </div>
);

const InsightCard = ({ title, score, icon }) => (
    <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between hover:bg-blue-600/5 transition-all">
        <div><div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8">{icon}</div><h4 className="text-white font-black uppercase text-lg mb-2 tracking-tighter">{title}</h4><p className="text-slate-500 text-[10px] font-medium leading-relaxed">Live telemetry data point.</p></div>
        <div className="flex items-baseline gap-4 mt-8"><span className="text-5xl font-black italic text-white">{score}</span><span className="text-[10px] font-black text-slate-600 uppercase">Index</span></div>
    </div>
);

const LiveLocationControl = ({ combinedData, onAreaFound }) => {
    const map = useMap();
    const [searching, setSearching] = useState(false);
    const handleLocate = () => {
        setSearching(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const point = [pos.coords.longitude, pos.coords.latitude];
            let found = null;
            combinedData.features.forEach(f => { if (f.geometry && turf.booleanPointInPolygon(point, f)) found = f; });
            if (found) { map.flyTo([pos.coords.latitude, pos.coords.longitude], 13); onAreaFound(found); }
            else alert("Outside mapped region.");
            setSearching(false);
        }, () => setSearching(false));
    };
    return (
        <button onClick={handleLocate} disabled={searching} className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-blue-700 active:scale-95 disabled:opacity-50">
            <Navigation className={searching ? "animate-pulse" : ""} size={16} /> {searching ? "Scanning..." : "My Matrix"}
        </button>
    );
};

// --- MAIN PAGE ---

const LivabilityScore = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [compareArea, setCompareArea] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [allScores, setAllScores] = useState({});
  const [showInsights, setShowInsights] = useState(false);

  const combinedData = useMemo(() => ({ type: "FeatureCollection", features: [...mumbaiData.features, ...naviMumbaiData.features] }), []);

  useEffect(() => {
    fetch('http://localhost:5000/api/livability_all').then(res => res.json()).then(data => {
      const scoreMap = {}; data.forEach(item => { scoreMap[item.area_name.toUpperCase().trim()] = item.overall_score; }); setAllScores(scoreMap);
    }).catch(err => console.error(err));
  }, []);

  const handleAreaClick = async (feature) => {
    const id = getIdentifier(feature);
    const p = feature.properties;
    const isNaviMumbai = !!(p.Name && !isNaN(p.Name));
    
    // UI Formatting
    let displayId = id;
    let label = "";

    if (isNaviMumbai) {
        // Navi Mumbai: CamelCase Node Name
        displayId = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
        label = `${displayId} Node`;
    } else {
        // Mumbai: Keep Ward ID as is (e.g. A, K/E)
        label = `Ward ${id}`;
    }
    
    const localities = localityMap[displayId] || localityMap[id] || (p.Name ? [`Sector ${p.Name}`] : ['Main Locality']);
    const randomLocality = localities[Math.floor(Math.random() * localities.length)];

    try {
      const res = await fetch(`http://localhost:5000/api/livability/${encodeURIComponent(id)}`);
      const data = await res.json();
      const factors = [
        { title: "Public Safety", val: data.safety_score, icon: <ShieldCheck /> },
        { title: "Health Facilities", val: Math.min(100, data.safety_score + 8), icon: <Building2 /> },
        { title: "Academic Hubs", val: Math.min(100, data.environment_score - 4), icon: <GraduationCap /> },
        { title: "Transit Network", val: data.mobility_score, icon: <Zap /> },
        { title: "Green Coverage", val: data.environment_score, icon: <Trees /> }
      ];
      const areaData = { displayLabel: label, locality: randomLocality, factors, ...data };
      if (comparisonMode) { if (!selectedArea) setSelectedArea(areaData); else setCompareArea(areaData); }
      else { setSelectedArea(areaData); setCompareArea(null); }
    } catch (err) { console.error(err); }
  };

  const onEachArea = (feature, layer) => {
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.8, weight: 3 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.5, weight: 1.5 }),
      click: (e) => handleAreaClick(feature)
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#030712] overflow-hidden font-sans">
      <div className="flex-1 relative">
        <MapContainer center={[19.0760, 72.9777]} zoom={11} className="h-full w-full" maxBounds={[[18.75, 72.3], [19.45, 73.6]]} maxBoundsViscosity={1.0} minZoom={10.5} maxZoom={16}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <div className="absolute top-10 left-10 z-[1000] flex flex-col gap-6">
            <div className="bg-slate-900/95 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
              <h1 className="text-2xl font-black italic text-white flex items-center gap-3"><Activity className="text-blue-500 w-6 h-6" /> LIVE INDEX</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-Time City Performance</p>
            </div>
            <button onClick={() => { setComparisonMode(!comparisonMode); setCompareArea(null); }} className={`px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-4 transition-all shadow-xl ${comparisonMode ? 'bg-orange-600 text-white shadow-orange-500/20' : 'bg-slate-900 text-slate-300 border border-white/10'}`}><ArrowLeftRight size={16} /> {comparisonMode ? 'Exit Mode' : 'Compare Areas'}</button>
            <LiveLocationControl combinedData={combinedData} onAreaFound={handleAreaClick} />
          </div>
          <GeoJSON key={`${Object.keys(allScores).length}-${comparisonMode}-${!!selectedArea}`} data={combinedData} style={(f) => ({ fillColor: getColor(allScores[getIdentifier(f)]), weight: 1.5, color: 'white', fillOpacity: 0.5 })} onEachFeature={onEachArea} />
        </MapContainer>
      </div>

      {selectedArea && (
        <div className={`fixed right-0 top-0 h-full bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 transition-all duration-700 z-[2000] ${comparisonMode ? 'w-[650px]' : showInsights ? 'w-full' : 'w-[450px]'} flex shadow-2xl overflow-hidden`}>
           <div className={`${comparisonMode ? 'w-1/2' : 'w-full'} p-8 flex flex-col border-r border-white/5 overflow-hidden`}>
                <AreaSummary area={selectedArea} onDismiss={() => { setSelectedArea(null); setCompareArea(null); }} onInsights={() => setShowInsights(true)} isComparison={comparisonMode} />
           </div>
           {comparisonMode && (
             <div className="w-1/2 p-8 flex flex-col bg-slate-900/10">
                {compareArea ? (
                    <AreaSummary area={compareArea} onDismiss={() => setCompareArea(null)} onInsights={() => {}} isComparison={true} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 animate-pulse"><GitCompare size={32} /></div>
                        <h3 className="text-xl font-black text-white uppercase italic">Target Area</h3>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Select second ward on map</p>
                    </div>
                )}
             </div>
           )}
           {showInsights && !comparisonMode && (
             <div className="absolute inset-0 bg-slate-950 p-20 overflow-y-auto animate-in fade-in duration-500 z-50">
                <div className="flex justify-between items-center mb-16">
                    <div><h3 className="text-6xl font-black italic text-white uppercase leading-none tracking-tighter">Analytical Matrix</h3><p className="text-blue-500 text-2xl font-black mt-2 uppercase">{selectedArea.displayLabel} / {selectedArea.locality}</p></div>
                    <button onClick={() => setShowInsights(false)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">Close</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {selectedArea.factors.map((f, i) => <InsightCard key={i} title={f.title} score={f.val} icon={f.icon} />)}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default LivabilityScore;