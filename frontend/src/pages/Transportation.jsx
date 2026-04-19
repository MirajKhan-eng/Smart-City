import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Search, Train, Bus, Car, AlertCircle, Info, X, Loader2, 
    Navigation, Leaf, Gauge, MapPin, ArrowRight, Share2, ShieldAlert, ChevronRight,
    Clock, Heart
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapFocusHandler = ({ start, end }) => {
    const map = useMap();
    useEffect(() => {
        if (start && end) {
            map.fitBounds([[start.lat, start.lon], [end.lat, end.lon]], { padding: [100, 100] });
        }
    }, [start, end, map]);
    return null;
};

const AddressAutocomplete = ({ placeholder, value, onChange, icon: Icon, colorClass }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    const fetchSuggestions = async (val) => {
        if (val.length < 3) { setSuggestions([]); return; }
        setLoading(true);
        try {
            // Smart search: include Mumbai to focus results
            const query = val.toLowerCase().includes("mumbai") ? val : `${val}, Mumbai`;
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`);
            setSuggestions(res.data);
            setShow(true);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        onChange(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchSuggestions(val), 500);
    };

    return (
        <div className="relative group w-full">
            <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${colorClass} transition-colors z-10`} size={16} />
            <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 relative z-0" 
                placeholder={placeholder} 
                value={value}
                onChange={handleChange}
                onFocus={() => suggestions.length > 0 && setShow(true)}
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500 z-10" size={14} />}
            
            {show && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[5000] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-2">
                        {suggestions.map((s, i) => {
                            const mainName = s.display_name.split(',')[0];
                            const subName = s.display_name.split(',').slice(1).join(',').trim();
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => { onChange(s.display_name); setShow(false); }}
                                    className="px-6 py-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group/item transition-colors rounded-xl mb-1 last:mb-0"
                                >
                                    <div className="flex items-start gap-4 overflow-hidden">
                                        <div className="mt-1 bg-slate-100 p-2 rounded-full text-slate-400 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-all">
                                            <Clock size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-black text-slate-900 truncate leading-tight">{mainName}</p>
                                            <p className="text-[10px] text-slate-500 truncate mt-1 font-medium">{subName}</p>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 hover:text-rose-500 transition-colors pl-4">
                                        <Heart size={16} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {show && <div className="fixed inset-0 z-[4000]" onClick={() => setShow(false)}></div>}
        </div>
    );
};

const Transportation = () => {
    const [search, setSearch] = useState({ from: '', to: '', purpose: 'Casual' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState(null);

    const onSearch = async () => {
        if (!search.from || !search.to) return;
        setLoading(true);
        setData(null); 
        try {
            const res = await axios.post('http://localhost:5000/api/transport/calculate', search);
            if (res.data.success === false) {
                alert(res.data.error || "Location not found. Please try a more specific address.");
            } else {
                setData(res.data);
                setSelectedMode(res.data.options[0]);
            }
        } catch (err) {
            console.error("Route calculation error:", err);
            alert("Connection error. Ensure your backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#030712] font-sans text-slate-300 overflow-hidden">
            
            {/* Left Sidebar */}
            <div className="w-[450px] bg-slate-900/80 backdrop-blur-3xl border-r border-white/5 p-8 overflow-y-auto custom-scrollbar flex flex-col z-[1000]">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Navigation className="text-blue-500" /> RAPID ROUTE
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Next-Gen Urban Transit</p>
                </header>

                <div className="space-y-4 mb-10">
                    <AddressAutocomplete 
                        placeholder="Pickup Location (A)" 
                        value={search.from} 
                        onChange={(v) => setSearch({...search, from: v})} 
                        icon={MapPin} 
                        colorClass="text-blue-500" 
                    />
                    <AddressAutocomplete 
                        placeholder="Destination Point (B)" 
                        value={search.to} 
                        onChange={(v) => setSearch({...search, to: v})} 
                        icon={MapPin} 
                        colorClass="text-emerald-500" 
                    />
                    
                    <div className="flex gap-2">
                        {['Office', 'Student', 'Casual'].map(p => (
                            <button 
                                key={p} 
                                onClick={() => setSearch({...search, purpose: p})}
                                className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${search.purpose === p ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={onSearch}
                        disabled={loading}
                        className="w-full py-5 bg-white text-black hover:bg-blue-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Calculate Best Route <ArrowRight size={16} /></>}
                    </button>
                </div>

                {data && (
                    <div className="flex-1 space-y-5 animate-in slide-in-from-left duration-700 pb-10">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimized Results</h3>
                            <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{data.distance} Path</span>
                        </div>

                        {data.options.map((opt, i) => (
                            <div 
                                key={i} 
                                onClick={() => setSelectedMode(opt)}
                                className={`p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${selectedMode?.mode === opt.mode ? 'bg-white/10 border-blue-500/50 shadow-2xl' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${selectedMode?.mode === opt.mode ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                                        {opt.mode === 'Train' ? <Train size={18} /> : opt.mode === 'Bus' ? <Bus size={18} /> : <Car size={18} />}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black italic text-white leading-none">{opt.fare}</div>
                                        <div className="text-[8px] font-black uppercase text-slate-500 mt-1">{opt.time} Mins</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[11px] font-black uppercase tracking-tight text-white">{opt.mode} Option</div>
                                        <div className="text-[9px] font-bold text-slate-500">{opt.info}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                                        <Leaf size={10} /> {opt.carbon}kg CO2
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Map View */}
            <div className="flex-1 relative">
                <MapContainer 
                    center={[19.0760, 72.8777]} 
                    zoom={11} 
                    className="h-full w-full" 
                    maxBounds={[[18.75, 72.6], [19.45, 73.4]]} 
                    maxBoundsViscosity={1.0}
                    minZoom={10}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    {data && (
                        <>
                            <Marker position={[data.coords.start.lat, data.coords.start.lon]}>
                                <Popup><div className="font-black text-[10px] p-2 uppercase">Pickup: {search.from.split(',')[0]}</div></Popup>
                            </Marker>
                            <Marker position={[data.coords.end.lat, data.coords.end.lon]}>
                                <Popup><div className="font-black text-[10px] p-2 uppercase">Drop: {search.to.split(',')[0]}</div></Popup>
                            </Marker>
                            <Polyline 
                                positions={[[data.coords.start.lat, data.coords.start.lon], [data.coords.end.lat, data.coords.end.lon]]} 
                                color="#2563eb" weight={6} opacity={0.6}
                            />
                            <MapFocusHandler start={data.coords.start} end={data.coords.end} />
                        </>
                    )}
                </MapContainer>

                {/* Status Overlays */}
                {data && selectedMode && (
                    <div className="absolute top-10 right-10 flex flex-col gap-4 z-[1000] w-80 animate-in fade-in slide-in-from-right duration-700">
                        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/20">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldAlert size={14} /> Navigation Intel
                            </h4>
                            
                            {/* NEW: TRANSIT INSTRUCTION BOX */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Transit Guide</p>
                                <p className="text-slate-900 font-black text-xs leading-snug">
                                    {selectedMode.instruction}
                                </p>
                            </div>

                            <p className="text-slate-600 font-bold text-[11px] leading-relaxed mb-4">
                                {data.recommendation.text}
                            </p>
                            
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <div className="flex-1">
                                    <div className="text-[8px] font-black text-slate-400 uppercase">Intensity</div>
                                    <div className={`text-xl font-black italic ${selectedMode.crowd === 'Low' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedMode.crowd}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-slate-400 uppercase">Saving</div>
                                    <div className="text-xl font-black text-slate-900 italic">-{selectedMode.carbon}kg</div>
                                </div>
                            </div>
                        </div>

                        {data.alerts.map((alert, i) => (
                            <div key={i} className="bg-rose-600 p-5 rounded-[2rem] shadow-2xl flex gap-4 items-start border border-rose-500">
                                <AlertCircle size={20} className="text-white shrink-0" />
                                <div>
                                    <p className="text-[9px] font-black text-rose-100 uppercase tracking-widest">{alert.title}</p>
                                    <p className="text-white text-xs font-bold leading-tight">{alert.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transportation;