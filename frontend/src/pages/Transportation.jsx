import React, { useState } from 'react';
import axios from 'axios';
import { Search, Train, Bus, Car, AlertCircle, Info, X, Loader2 } from 'lucide-react';

const Transportation = () => {
    const [search, setSearch] = useState({ from: '', to: '', purpose: 'Casual' });
    const [data, setData] = useState(null);
    const [showCompare, setShowCompare] = useState(false);
    const [loading, setLoading] = useState(false);

    const onSearch = async () => {
        if (!search.from || !search.to) {
            alert("Please enter both starting and destination points.");
            return;
        }

        setLoading(true);
        setData(null); 

        try {
            const res = await axios.post('http://localhost:5000/api/transport/calculate', search);
            setData(res.data);
        } catch (err) {
            console.error("Transportation fetch error:", err);
            alert("Location not found in database. Try 'Panvel', 'CSMT', 'Vashi', or 'Thane'.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen font-sans text-slate-900">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Smart City Transportation</h1>
                <p className="text-slate-500 text-sm">Plan your journey with real-time insights</p>
            </header>

            {/* Input Section */}
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-slate-400 w-4" />
                        <input 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="From (e.g., Panvel)" 
                            value={search.from}
                            onChange={e => setSearch({...search, from: e.target.value})} 
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-slate-400 w-4" />
                        <input 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="To (e.g., CSMT)" 
                            value={search.to}
                            onChange={e => setSearch({...search, to: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                    {['Office', 'Student', 'Casual'].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setSearch({...search, purpose: p})}
                            className={`flex-1 py-2.5 rounded-xl border transition-all font-semibold text-sm ${search.purpose === p ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={onSearch} 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Calculating Real-Time Routes...</>
                    ) : (
                        "Search Options"
                    )}
                </button>
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl w-full"></div>
                    ))}
                </div>
            )}

            {data && !loading && (
                <div key={data.distance} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900">Available Transport Options</h2>
                            <p className="text-slate-500 text-xs font-medium tracking-wide uppercase">Total Distance: {data.distance}</p>
                        </div>
                        <button onClick={() => setShowCompare(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-lg">
                            <Info className="w-4" /> Compare All
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        {data.options.map((opt, index) => (
                            <div key={`${opt.mode}-${index}`} className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl hover:shadow-lg hover:border-blue-100 transition-all bg-white group">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {opt.mode === 'Train' ? <Train size={24} /> : opt.mode === 'Bus' ? <Bus size={24} /> : <Car size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{opt.mode}</span>
                                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-600 text-white shadow-sm">{opt.tag}</span>
                                        </div>
                                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Route Info</div>
                                        <div className="text-slate-600 text-xs font-medium">{opt.info}</div>
                                        <div className="text-blue-600 text-sm font-bold mt-1">{opt.time} min</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Est. Fare</div>
                                    <div className="font-black text-2xl text-slate-900">{opt.fare}</div>
                                    <div className={`text-[10px] font-black uppercase mt-2 px-2 py-1 rounded-md inline-block shadow-sm ${opt.crowd === 'Heavy' || opt.crowd === 'Full' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                                        Crowd: {opt.crowd}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                                <Info className="w-5" /> Smart Recommendation
                            </div>
                            <p className="text-blue-900 font-black text-sm uppercase tracking-tight">Best Option for {search.purpose}</p>
                            <p className="text-blue-700 text-sm mt-2 leading-relaxed font-medium">{data.recommendation.text}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 font-black mb-2 uppercase text-[10px] tracking-[0.2em] text-slate-400">
                                <AlertCircle className="w-4" /> Live System Alerts
                            </div>
                            {data.alerts.map(alert => (
                                <div key={alert.id} className={`p-4 rounded-xl text-xs flex gap-3 items-start border ${alert.type === 'danger' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                    <div className="mt-0.5"><AlertCircle size={14} /></div>
                                    <div>
                                        <span className="font-bold uppercase tracking-tighter mr-2">{alert.title}:</span>
                                        <span className="font-medium opacity-90">{alert.msg}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showCompare && data && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 relative shadow-2xl border border-white/20">
                        <button onClick={() => setShowCompare(false)} className="absolute right-8 top-8 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 text-slate-400" />
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">Transport Comparison</h2>
                        <p className="text-slate-400 text-sm mb-8 font-medium">REAL-TIME DATA ANALYSIS FOR {data.distance.toUpperCase()}</p>
                        
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                                        <th className="p-5">Mode</th>
                                        <th className="p-5">Est. Time</th>
                                        <th className="p-5">Est. Fare</th>
                                        <th className="p-5">Crowd</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.options.map((opt, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                                            <td className="p-5 font-bold text-slate-900">{opt.mode}</td>
                                            <td className="p-5 font-semibold text-blue-600">{opt.time} min</td>
                                            <td className="p-5 font-black text-slate-900">{opt.fare}</td>
                                            <td className="p-5">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${opt.crowd === 'Heavy' || opt.crowd === 'Full' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {opt.crowd}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transportation;