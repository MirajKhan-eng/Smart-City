import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../api";
import {
  Shield, Clock, MapPin, ThumbsUp, Trash2, CheckCircle, AlertTriangle, 
  Send, Briefcase, Filter, BarChart3, Activity, PieChart, Users, ChevronRight,
  Search, AlertCircle, TrendingUp
} from "lucide-react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const TRACKING_STEPS = [
  { id: 1, label: "Reported", color: "bg-slate-500" },
  { id: 2, label: "Dept Assigned", color: "bg-blue-500" },
  { id: 3, label: "Site Inspection", color: "bg-indigo-500" },
  { id: 4, label: "Work in Progress", color: "bg-amber-500" },
  { id: 5, label: "Final Inspection", color: "bg-emerald-500" },
  { id: 6, label: "Resolved", color: "bg-green-600" },
];

const AnalyticsCard = ({ label, val, icon, color }) => (
  <div className="bg-slate-900/40 border border-white/5 px-8 py-5 rounded-[2.5rem] min-w-[150px] backdrop-blur-xl">
    <div className={`flex items-center justify-between mb-2 ${color}`}>
      {icon}
      <span className="text-3xl font-black italic">{val}</span>
    </div>
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
      {label}
    </p>
  </div>
);

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState('list');
  const userAdmin = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reports/all`),
        axios.get(`${API_BASE_URL}/api/admin/analytics`),
      ]);
      setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setUpdatingId(id);
    try {
      // Sync status with tracking step if step is provided
      if (data.tracking_step) {
          if (data.tracking_step === 6) data.status = "Resolved";
          else if (data.tracking_step >= 2) data.status = "In Progress";
      }
      await axios.put(`${API_BASE_URL}/api/admin/reports/${id}`, data);
      fetchData();
    } catch (err) {
      alert("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report? This action is permanent.")) return;
    try {
        await axios.delete(`${API_BASE_URL}/api/admin/reports/${id}`);
        fetchData();
    } catch (err) {
        alert("Delete failed");
    }
  };

  const filteredReports = useMemo(() => {
    let rpts = Array.isArray(reports) ? [...reports] : [];
    
    // 1. ISOLATE SOS vs CIVIC based on admin dept_id
    if (userAdmin?.dept_id === 'MUM-2026-SOS') {
        rpts = rpts.filter(r => r.department === 'SOS');
    } else {
        rpts = rpts.filter(r => r.department !== 'SOS');
    }

    // 2. APPLY TAB FILTER
    if (activeTab !== "All") {
        rpts = rpts.filter((r) => r.department === activeTab);
    }

    // 3. SORTING: 
    // - Resolved at bottom
    // - Priority (High > Medium > Low) 
    // - Votes
    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return rpts.sort((a, b) => {
        // Resolved last
        const resA = a.status === 'Resolved' ? 1 : 0;
        const resB = b.status === 'Resolved' ? 1 : 0;
        if (resA !== resB) return resA - resB;

        const pA = priorityMap[a.priority] || 0;
        const pB = priorityMap[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        return (b.votes || 0) - (a.votes || 0);
    });
  }, [reports, activeTab, userAdmin]);

  const getPriorityColor = (p) => {
    if (p === "High") return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (p === "Medium") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans p-4 md:p-10">
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
              <Shield className="text-blue-500 w-12 h-12" /> COMMAND CENTER
            </h1>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Strategic Analytics Node
            </p>
          </div>
          <div className="flex gap-4">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                Operations
              </button>
              <button 
                onClick={() => setViewMode('analytics')}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                Analytics
              </button>
          </div>
        </div>
      </div>

      {viewMode === 'analytics' && analytics && (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Reports</p>
                    <h4 className="text-4xl font-black text-white italic tracking-tighter">{analytics.summary?.total || 0}</h4>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Resolution Rate</p>
                    <h4 className="text-4xl font-black text-white italic tracking-tighter">
                        {Math.round((parseInt(analytics.summary?.resolved || 0) / (parseInt(analytics.summary?.total || 1))) * 100)}%
                    </h4>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">In Progress</p>
                    <h4 className="text-4xl font-black text-white italic tracking-tighter">{analytics.summary?.in_progress || 0}</h4>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Urgent Backlog</p>
                    <h4 className="text-4xl font-black text-white italic tracking-tighter">{analytics.summary?.pending || 0}</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem]">
                      <div className="flex items-center justify-between mb-10">
                          <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                              <TrendingUp className="text-blue-500" /> Resolution Trends
                          </h3>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Last 30 Days</span>
                      </div>
                      <div style={{ width: '100%', height: 350, minHeight: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={Array.isArray(analytics.trends) ? analytics.trends : []}>
                                  <defs>
                                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                  />
                                  <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem]">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-3 mb-10">
                          <PieChart className="text-indigo-500" /> Dept Workload
                      </h3>
                      <div style={{ width: '100%', height: 350, minHeight: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={Array.isArray(analytics.departments) ? analytics.departments : []}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis dataKey="department" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    cursor={{fill: '#ffffff05'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                  />
                                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                      {(Array.isArray(analytics.departments) ? analytics.departments : []).map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'list' && (
          <>
            <div className="max-w-7xl mx-auto mb-10 flex flex-wrap gap-3">
              {["All", "PWD", "Waste", "Environment", "Traffic", "Water"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === tab ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 gap-8">
                {filteredReports.map((report) => (
                  <div key={report.id} className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 flex flex-col lg:flex-row gap-10 hover:border-blue-500/20 transition-all group ${report.status === 'Resolved' ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                    <div className="w-full lg:w-1/3 relative">
                      {report.image_url ? (
                        <div className="h-full min-h-[250px] rounded-[2.5rem] overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
                          <img src={report.image_url} className="w-full h-full object-cover" alt="Evidence" />
                        </div>
                      ) : (
                        <div className="h-full min-h-[250px] rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-700">
                          <PieChart size={48} />
                        </div>
                      )}
                      {report.status === 'Resolved' && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(report.priority)}`}>
                            {report.priority} PRIORITY
                          </span>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                            {report.department} Dept
                          </span>
                          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
                            <ThumbsUp size={12} /> {report.votes || 0} Votes
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                            title="Delete Report"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">{report.title}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed max-w-2xl">{report.description}</p>

                      <div className="flex flex-wrap gap-3 mb-10">
                        <span className="flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-300 uppercase border border-white/5">
                          <MapPin size={14} className="text-blue-500" /> {report.location}
                        </span>
                      </div>

                      <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Pipeline</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase">
                            {TRACKING_STEPS[(report.tracking_step || 1) - 1]?.label || 'Reported'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {TRACKING_STEPS.map((step) => (
                            <div
                              key={step.id}
                              onClick={() => handleUpdate(report.id, { tracking_step: step.id, status: step.id === 6 ? "Resolved" : "In Progress" })}
                              className={`flex-1 h-3 rounded-full cursor-pointer transition-all ${report.tracking_step >= step.id ? step.color : "bg-white/5"}`}
                              title={step.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                        <div className="w-full md:w-64">
                          <label className="block text-[8px] font-black text-slate-500 uppercase mb-3 ml-2">Update Operational Step</label>
                          <select
                            className="w-full bg-slate-900 border border-white/10 text-[9px] font-black uppercase text-white p-4 rounded-2xl outline-none cursor-pointer focus:border-blue-500 transition-all"
                            value={report.tracking_step}
                            onChange={(e) => handleUpdate(report.id, { tracking_step: parseInt(e.target.value) })}
                          >
                            {TRACKING_STEPS.map(step => (
                                <option key={step.id} value={step.id}>{step.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full md:w-48">
                          <label className="block text-[8px] font-black text-slate-500 uppercase mb-3 ml-2">Change Priority</label>
                          <select
                            className="w-full bg-slate-900 border border-white/10 text-[9px] font-black uppercase text-white p-4 rounded-2xl outline-none cursor-pointer focus:border-blue-500 transition-all"
                            value={report.priority}
                            onChange={(e) => handleUpdate(report.id, { priority: e.target.value })}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
      )}
    </div>
  );
};

export default AdminDashboard;
