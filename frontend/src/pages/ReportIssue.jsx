import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ThumbsUp, 
  MapPin, 
  Camera, 
  Plus, 
  X, 
  MessageSquare, 
  Navigation, 
  Filter,
  AlertCircle,
  Clock,
  ChevronDown
} from 'lucide-react';

const ReportIssue = () => {
    const [reports, setReports] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [votedIds, setVotedIds] = useState(new Set());
    const [formData, setFormData] = useState({ 
        title: '', 
        description: '', 
        category: 'Pothole', 
        location: '', 
        image_url: '' 
    });
    const user = JSON.parse(localStorage.getItem('user'));

    const categories = [
        "Pothole", 
        "Streetlight", 
        "Waste Management", 
        "Water Leakage", 
        "Security/Crime", 
        "Traffic Issue", 
        "Other"
    ];

    useEffect(() => { 
        fetchReports(); 
        if (user) fetchMyVotes();
    }, []);

    const fetchMyVotes = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/reports/my-votes/${user.id}`);
            setVotedIds(new Set(res.data));
        } catch (err) { console.error("Votes Sync Failed"); }
    };

    const fetchReports = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/reports/all`);
            setReports(res.data);
        } catch (err) { console.error("Fetch Failed"); }
    };

    const handleLike = async (id) => {
        if (!user) return alert("Please Login to vote");
        
        const isVoted = votedIds.has(id);
        const newVotedIds = new Set(votedIds);
        
        if (isVoted) {
            newVotedIds.delete(id);
            setReports(prev => prev.map(r => r.id === id ? { ...r, votes: Math.max(0, (r.votes || 1) - 1) } : r));
        } else {
            newVotedIds.add(id);
            setReports(prev => prev.map(r => r.id === id ? { ...r, votes: (r.votes || 0) + 1 } : r));
        }
        setVotedIds(newVotedIds);

        try {
            await axios.post(`http://localhost:5000/api/reports/${id}/vote`, { user_id: user.id });
            setTimeout(fetchReports, 500); 
        } catch (err) { 
            fetchReports(); 
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setFormData({ ...formData, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
            });
        }
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                setFormData({ ...formData, image_url: canvas.toDataURL('image/jpeg', 0.6) });
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, user_id: parseInt(user.id) };
            await axios.post('http://localhost:5000/api/reports/submit', payload);
            setShowForm(false);
            setFormData({ title: '', description: '', category: 'Pothole', location: '', image_url: '' });
            fetchReports();
        } catch (err) {
            alert("Submission failed.");
        } finally { setLoading(false); }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase().replace('-', ' ');
        switch (s) {
            case 'resolved': return 'bg-green-100 text-green-600 border-green-200';
            case 'in progress': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
            case 'pending': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 bg-[#FBFBFE] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Community Feed</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Priority Sorted by Citizen Votes</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)} 
                    className="bg-blue-600 text-white p-5 rounded-[2rem] shadow-xl shadow-blue-200 hover:scale-110 transition-all hover:bg-blue-700 active:scale-95"
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Reports List */}
            <div className="space-y-8 pb-20">
                {reports.length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">Synchronizing secure data...</div>
                ) : reports.map(report => (
                    <div key={report.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">
                                    {report.reporter_name?.[0].toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 leading-none">{report.reporter_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1.5 tracking-tighter">
                                        ID: #{report.id} • {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${getStatusStyle(report.status)}`}>
                                {report.status || 'Pending'}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="inline-block bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-lg uppercase border border-blue-100 mb-1">{report.type}</div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{report.title}</h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{report.description}</p>
                        </div>

                        {report.image_url && (
                            <div className="rounded-[2rem] overflow-hidden mb-6 border border-slate-50 shadow-inner group-hover:shadow-2xl transition-all duration-700">
                                <img src={report.image_url} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-1000" alt="Evidence" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-8">
                            <MapPin size={16} className="text-blue-500" /> 
                            <span className="truncate">{report.location}</span>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-slate-50">
                            <button 
                                onClick={() => handleLike(report.id)} 
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group/btn shadow-sm ${votedIds.has(report.id) ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                                <ThumbsUp size={18} className="group-active/btn:scale-125 transition-transform" /> 
                                <span>{report.votes || 0}</span>
                            </button>
                            <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                                <MessageSquare size={18} /> Discuss
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Report Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in-95 duration-300 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="font-black text-3xl uppercase italic tracking-tighter text-slate-900">New City Report</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Citizen Submission</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all text-slate-500"><X size={24}/></button>
                        </div>
                        
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Category</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-4 bg-slate-50 rounded-2xl outline-none appearance-none font-bold text-slate-700 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Title</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                                    placeholder="Brief summary of the issue" 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Location</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                                        placeholder="Address or area" 
                                        value={formData.location}
                                        onChange={e => setFormData({...formData, location: e.target.value})} 
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleGetLocation}
                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
                                        title="Get Current Location"
                                    >
                                        <Navigation size={24} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Description</label>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-32 font-medium border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all" 
                                    placeholder="Provide detailed information about the issue..." 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Evidence Upload</label>
                                <label className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-slate-50 transition-all group">
                                    <Camera className="text-slate-200 mb-3 group-hover:text-blue-500 transition-colors" size={48} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{formData.image_url ? "IMAGE READY ✓" : "UPLOAD PHOTO (MAX 5MB)"}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImage} />
                                </label>
                            </div>

                            <button 
                                disabled={loading} 
                                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "PROCESSING..." : "SUBMIT OFFICIAL REPORT"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportIssue;