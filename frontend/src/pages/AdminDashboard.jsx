import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Shield, Clock, MapPin, ThumbsUp, Trash2, CheckCircle, AlertTriangle, 
    Send, Briefcase, Filter, BarChart3, Activity, PieChart, Users
} from 'lucide-react';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reports/all'),
        axios.get('http://localhost:5000/api/admin/analytics')
      ]);
      setReports(reportsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const adminMsg = prompt("Enter progress update or resolution message:");
    setUpdatingId(id);
    try {
      await axios.put(`http://localhost:5000/api/admin/reports/${id}`, {
        status: newStatus,
        admin_message: adminMsg || "Official Update Provided",
        priority: 'High'
      });
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent Delete? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/reports/${id}`);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      alert("Deletion failed");
    }
  };

  const filteredReports = useMemo(() => {
    if (activeTab === 'All') return reports;
    return reports.filter(r => r.department?.includes(activeTab));
  }, [reports, activeTab]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'resolved') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'in progress') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans p-4 md:p-10">
      
      {/* Header & Meta */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Shield className="text-blue-500 w-12 h-12" /> ADMIN CORE
                </h1>
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500" /> Live Smart City Management Terminal
                </p>
            </div>
            {analytics && (
                <div className="flex gap-4">
                    <AnalyticsCard label="Active Cases" val={analytics.pending} icon={<Clock />} color="text-rose-500" />
                    <AnalyticsCard label="Resolved" val={analytics.resolved} icon={<CheckCircle />} color="text-emerald-500" />
                    <AnalyticsCard label="Total Impact" val={analytics.total} icon={<Activity />} color="text-blue-500" />
                </div>
            )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3"><BarChart3 className="text-blue-500" /> Dept Distribution</h3>
                    <PieChart className="text-slate-700" size={20} />
                </div>
                <div className="space-y-6">
                    {Object.entries(analytics.departments).map(([dept, count]) => (
                        <div key={dept} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>{dept} Department</span>
                                <span className="text-white">{count} Reports</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(count / (analytics.total || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl shadow-blue-500/10">
                <div>
                    <h3 className="text-white font-black text-2xl uppercase italic leading-tight mb-4">Resolution Efficiency</h3>
                    <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">Global Performance Index</p>
                </div>
                <div className="text-7xl font-black text-white italic py-8">
                    {Math.round((analytics.resolved / (analytics.total || 1)) * 100)}%
                </div>
                <div className="flex items-center gap-2 text-blue-200 text-[10px] font-black uppercase tracking-widest">
                    <Users size={14} /> Official Response Rate
                </div>
            </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-wrap gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {['All', 'PWD', 'Waste', 'Environment', 'Traffic', 'Water'].map(tab => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === tab ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
            >
                {tab}
            </button>
        ))}
      </div>

      {/* Report Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
            <div className="py-40 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Syncing with Central Intelligence...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredReports.map(report => (
                    <div key={report.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-10 -mt-10"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusColor(report.status)}`}>
                                {report.status || 'Pending'}
                            </div>
                            <button onClick={() => handleDelete(report.id)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase size={12} className="text-blue-500" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{report.department}</span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic leading-none truncate">{report.title}</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase mt-2">{report.type} • {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed mb-8 line-clamp-3 font-medium">{report.description}</p>

                        {report.image_url && (
                            <div className="aspect-video rounded-3xl overflow-hidden mb-8 border border-white/5 grayscale hover:grayscale-0 transition-all duration-700">
                                <img src={report.image_url} className="w-full h-full object-cover" alt="Evidence" />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mb-8">
                            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase border border-white/5">
                                <MapPin size={12} /> {report.location}
                            </span>
                            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase border border-white/5">
                                <ThumbsUp size={12} /> {report.votes || 0} Votes
                            </span>
                        </div>

                        <div className="bg-white/5 rounded-[2rem] p-6 mb-8 border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Official Resolution Message</p>
                            <p className="text-slate-300 text-xs italic font-medium">
                                {report.admin_message ? `"${report.admin_message}"` : "Awaiting departmental acknowledgement..."}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center font-black text-white text-xs shadow-lg">
                                    {report.reporter_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-[10px] font-black text-white uppercase tracking-wider">{report.reporter_name}</div>
                            </div>
                            <div className="relative">
                                <select 
                                    disabled={updatingId === report.id}
                                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                    value={report.status || 'Pending'}
                                    className="appearance-none bg-slate-900 border border-white/10 text-[9px] font-black uppercase text-white px-6 py-3 rounded-xl outline-none cursor-pointer hover:border-blue-500 transition-all"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">Working</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsCard = ({ label, val, icon, color }) => (
    <div className="bg-slate-900/40 border border-white/5 px-8 py-5 rounded-[2rem] min-w-[140px]">
        <div className={`flex items-center justify-between mb-2 ${color}`}>
            {icon}
            <span className="text-2xl font-black italic">{val}</span>
        </div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
);

export default AdminDashboard;