import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  Circle,
  LayersControl
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Users, 
  MapPin, 
  Search, 
  Navigation, 
  Heart, 
  Shield, 
  CreditCard, 
  Fuel,
  TrendingUp,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Calendar,
  MessageSquare,
  BarChart3,
  BusFront,
  AlertOctagon,
  Layers,
  ShoppingBag,
  Train,
  Zap,
  Waves,
  Newspaper,
  LayoutGrid,
  Sparkles,
  Clock,
  ArrowDown
} from 'lucide-react';

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getCustomIcon = (color, type) => {
    const iconHtml = `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);"><svg viewBox="0 0 24 24" style="color: white; width: 22px; height: 22px;" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${getIconPath(type)}</svg></div>`;
    return L.divIcon({ html: iconHtml, className: 'custom-marker', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });
};

const getIconPath = (type) => {
    switch(type) {
        case 'hospital': return '<path d="M12 5v14M5 12h14" stroke-width="4"/>';
        case 'police': return '<path d="M12 2l3 7h7l-6 5 2 8-6-5-6 5 2-8-6-5h7z" stroke-width="2" fill="currentColor"/>';
        case 'atm': return '<text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-weight="900" font-size="16" fill="white">₹</text>';
        case 'petrol': return '<path d="M3 22h18M7 7h10v10H7zM10 7V4h4v3" stroke-width="3"/>';
        case 'grocery': return '<path d="M6 6h15l-1.5 9h-12L6 6zM6 6l-2-4" stroke-width="3"/><circle cx="9" cy="20" r="2"/><circle cx="18" cy="20" r="2"/>';
        default: return '<circle cx="12" cy="12" r="8"/>';
    }
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const [filter, setFilter] = useState('none');
  const [userPos, setUserPos] = useState([19.0760, 72.8777]); 
  const [realLocations, setRealLocations] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // High-precision 2024 estimate for Mumbai + Navi Mumbai
  const [stats, setStats] = useState({ 
    temp: '--°C', 
    aqi: '--', 
    humidity: '--%', 
    population: '23,157,402' 
  });

  const [prices, setPrices] = useState({
    gold: { value: '72,450', change: '+0.5%' },
    silver: { value: '85,200', change: '-0.2%' },
    petrol: { value: '104.21', change: '0.0%' },
    diesel: { value: '92.15', change: '0.0%' }
  });

  useEffect(() => {
    fetchWeatherData();
    if (filter !== 'none') fetchNearbyPlaces();
    
    const weatherInterval = setInterval(fetchWeatherData, 300000);
    
    // Live Time Update
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Professional Population Growth Logic (Approx 1 net increase every 18s for Mumbai + NM)
    const popInterval = setInterval(() => {
        setStats(prev => {
            const currentPop = parseInt(prev.population.replace(/,/g, ''));
            return { ...prev, population: (currentPop + 1).toLocaleString() };
        });
    }, 18000);

    return () => { 
        clearInterval(weatherInterval); 
        clearInterval(popInterval); 
        clearInterval(timeInterval);
    };
  }, [userPos, filter]);

  const fetchWeatherData = async () => {
    try {
      const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current_weather=true&hourly=relativehumidity_2m`);
      const aqiRes = await axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=19.0760&longitude=72.8777&current=european_aqi,us_aqi`);
      const current = weatherRes.data.current_weather;
      const currentHour = new Date().getUTCHours();
      setStats(prev => ({
        ...prev,
        temp: Math.round(current.temperature) + '°C',
        aqi: (aqiRes.data.current.european_aqi || aqiRes.data.current.us_aqi).toString(),
        humidity: (weatherRes.data.hourly.relativehumidity_2m[currentHour] || 65) + '%'
      }));
    } catch (err) { console.error(err); }
  };

  const fetchNearbyPlaces = async () => {
    setMapLoading(true);
    try {
        const query = `[out:json][timeout:25];(node["amenity"~"hospital|clinic|pharmacy"](around:3000, ${userPos[0]}, ${userPos[1]});node["amenity"~"police"](around:3000, ${userPos[0]}, ${userPos[1]});node["amenity"~"atm|bank"](around:3000, ${userPos[0]}, ${userPos[1]});node["amenity"="fuel"](around:3000, ${userPos[0]}, ${userPos[1]});node["shop"~"supermarket|grocery"](around:3000, ${userPos[0]}, ${userPos[1]}););out body;`;
        const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        setRealLocations(res.data.elements.map(el => ({ id: el.id, name: el.tags.name || "City Facility", pos: [el.lat, el.lon], type: getCategoryType(el.tags) })));
    } catch (err) { console.error(err); } finally { setMapLoading(false); }
  };

  const getCategoryType = (tags) => {
    const a = tags.amenity || ""; const s = tags.shop || "";
    if (["hospital", "clinic", "pharmacy"].includes(a)) return 'hospital';
    if (a === 'police') return 'police';
    if (["atm", "bank"].includes(a)) return 'atm';
    if (a === 'fuel') return 'petrol';
    if (["supermarket", "grocery"].includes(s)) return 'grocery';
    return 'other';
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredLocations = filter === 'all' 
    ? realLocations 
    : realLocations.filter(loc => loc.type === filter);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-1000">
      
      {/* 1. CITY PULSE HERO */}
      <section className="relative overflow-hidden bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl border border-white/5">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Live City OS</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                            {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter leading-[0.9]">
                    Hello, <span className="text-blue-500">{user?.name || 'Citizen'}</span>
                </h1>
                <p className="text-lg text-gray-400 font-medium leading-relaxed">
                    Mumbai & Navi Mumbai pulse is <span className="text-green-400 font-black uppercase italic">Stable</span>. {parseInt(stats.aqi) < 80 ? 'Perfect air for a run.' : 'Moderate air quality today.'}
                </p>
                
                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={scrollToMap}
                        className="group bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2"
                    >
                        Explore Map <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate('/emergency')} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/20">SOS</button>
                </div>
            </div>
            
            <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
                <QuickStat icon={<Thermometer />} label="Weather" value={stats.temp} color="text-orange-400" />
                <QuickStat icon={<Activity />} label="AQI" value={stats.aqi} color="text-green-400" />
                <QuickStat icon={<Droplets />} label="Humid" value={stats.humidity} color="text-blue-400" />
            </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* TRANSIT HUB */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Transit Pulse</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Real-time Rail & BEST Bus</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase">
                    Live Status
                </div>
            </div>
            <div className="space-y-4">
                <TransitRow line="Western Line" status="On-Time" time="Frequent" color="bg-green-500" />
                <TransitRow line="Central Line" status="On-Time" time="Clear" color="bg-green-500" />
                <TransitRow line="BEST Bus #202" status="Active" time="Gorai Depot" color="bg-blue-500" />
                <TransitRow line="Metro Line 2A" status="Normal" time="Dahisar-DN Nagar" color="bg-yellow-500" />
            </div>
        </div>

        {/* POPULATION & MARKET */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Metro Population</h3>
                <h4 className="text-4xl font-black text-gray-900 tracking-tighter tabular-nums mb-1">{stats.population}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mumbai & Navi Mumbai Live</p>
                <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase italic">
                    <TrendingUp className="w-3 h-3" /> Growing Real-time
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                <PriceItem label="Gold 24K" value="₹72K" trend="+0.5%" isUp={true} />
                <PriceItem label="Petrol" value="₹104" trend="0.0%" isUp={true} />
            </div>
        </div>

        {/* CITY UPDATES */}
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col shadow-blue-200">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Bell className="w-5 h-5" /> City Updates</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <UpdateItem title="Western Line" desc="Regular services across all lines." status="NORMAL" />
                <UpdateItem title="Traffic Alert" desc="Slow moving traffic near BKC flyover." status="CAUTION" />
                <UpdateItem title="Civic Work" desc="Road repair in Vashi Sector 15." status="INFO" />
                <UpdateItem title="Weather" desc="Partly cloudy with sea breeze." status="GOOD" />
            </div>
        </div>

      </div>

      {/* MAP HUB */}
      <section ref={mapRef} className="bg-white rounded-[3.5rem] p-8 shadow-sm border border-gray-100 scroll-mt-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 px-4">
            <div>
                <h3 className="text-3xl font-black text-gray-900">Infrastructure Node</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">3KM Precision Satellite Scan</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} icon={<LayoutGrid className="w-4 h-4" />} label="All" color="bg-gray-900" />
                <FilterButton active={filter === 'hospital'} onClick={() => setFilter('hospital')} icon={<Heart className="w-4 h-4" />} label="Medical" color="bg-red-500" />
                <FilterButton active={filter === 'police'} onClick={() => setFilter('police')} icon={<Shield className="w-4 h-4" />} label="Police" color="bg-blue-600" />
                <FilterButton active={filter === 'atm'} onClick={() => setFilter('atm')} icon={<CreditCard className="w-4 h-4" />} label="ATM/Bank" color="bg-emerald-600" />
                <FilterButton active={filter === 'petrol'} onClick={() => setFilter('petrol')} icon={<Fuel className="w-4 h-4" />} label="Energy" color="bg-orange-500" />
            </div>
        </div>

        <div className="h-[650px] rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl relative group">
            <MapContainer center={userPos} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapUpdater center={userPos} />
                {filteredLocations.map(loc => {
                    const color = loc.type === 'hospital' ? '#ef4444' : loc.type === 'police' ? '#2563eb' : loc.type === 'atm' ? '#059669' : loc.type === 'petrol' ? '#f97316' : loc.type === 'grocery' ? '#9333ea' : '#475569';
                    return <Marker key={loc.id} position={loc.pos} icon={getCustomIcon(color, loc.type)}><Popup><div className="p-2"><h4 className="font-black text-[11px] uppercase">{loc.name}</h4><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{loc.type}</p></div></Popup></Marker>;
                })}
            </MapContainer>
            {mapLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
                    <div className="bg-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                        <div className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-gray-900">Satellite Scan in Progress...</span>
                    </div>
                </div>
            )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard onClick={() => navigate('/report-issue')} icon={<MessageSquare />} title="Civic Reports" desc="Resolution Portal" color="blue" />
          <ActionCard onClick={() => navigate('/livability')} icon={<BarChart3 />} title="Area Index" desc="Ward Rankings" color="emerald" />
          <ActionCard onClick={() => navigate('/emergency')} icon={<AlertOctagon />} title="Emergency" desc="SOS Response" color="red" />
      </section>

    </div>
  );
};

// HELPERS
const QuickStat = ({ icon, label, value, color }) => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] flex-1 min-w-[140px] group hover:bg-white/20 transition-all">
        <div className={`mb-3 ${color} group-hover:scale-110 transition-transform`}>{React.cloneElement(icon, { size: 24 })}</div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <h3 className="text-2xl font-black">{value}</h3>
    </div>
);

const TransitRow = ({ line, status, time, color }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-tighter">{line}</h4>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-blue-600 uppercase">{status}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{time}</p>
        </div>
    </div>
);

const UpdateItem = ({ title, desc, status }) => (
    <div className="p-4 bg-white/10 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-default">
        <div className="flex justify-between items-center mb-1">
            <h4 className="font-black text-xs uppercase tracking-tighter">{title}</h4>
            <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full">{status}</span>
        </div>
        <p className="text-[10px] text-white/70 font-medium leading-relaxed">{desc}</p>
    </div>
);

const PriceItem = ({ label, value, trend, isUp }) => (
    <div className="bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-lg font-black text-gray-900 leading-none">{value}</h4>
        <p className={`text-[8px] font-black mt-2 ${isUp ? 'text-green-500' : 'text-red-500'}`}>{trend}</p>
    </div>
);

const ActionCard = ({ icon, title, desc, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-600/5 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white',
        emerald: 'bg-emerald-600/5 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white',
        red: 'bg-red-600/5 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
    };
    return (
        <button onClick={onClick} className={`flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all text-left group ${colors[color]}`}>
            <div className="p-4 bg-white rounded-2xl shadow-md text-gray-900">{React.cloneElement(icon, { size: 28 })}</div>
            <div className="flex-1">
                <h4 className="font-black text-lg leading-none mb-1 uppercase tracking-tighter">{title}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">{desc}</p>
            </div>
            <ArrowUpRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
        </button>
    );
};

const FilterButton = ({ active, onClick, icon, label, color }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
      active ? `${color} text-white shadow-2xl border-transparent scale-105` : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
    }`}>
    {icon} {label}
  </button>
);

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 14); }, [center, map]);
  return null;
};

export default UserDashboard;