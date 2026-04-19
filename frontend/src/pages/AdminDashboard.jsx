import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Clock, MapPin, ThumbsUp, Trash2, CheckCircle, AlertTriangle, Send, MoreVertical, Trash } from 'lucide-react';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/all');
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const adminMsg = prompt("Enter progress update or resolution message (optional):");
    
    setUpdatingId(id);
    try {
      await axios.put(`http://localhost:5000/api/admin/reports/${id}`, {
        status: newStatus,
        admin_message: adminMsg || "Official Update Provided",
        priority: 'High'
      });
      fetchReports();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/reports/${id}`);
      setReports(reports.filter(r => r.id !== id));
      alert("Report deleted successfully");
    } catch (err) {
      alert("Failed to delete report");
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase().replace('-', ' ');
    switch (s) {
      case 'resolved': return 'bg-green-100 text-green-600 border-green-200';
      case 'in progress': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'pending': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen bg-[#FBFBFE]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase flex items-center gap-3">
            <Shield className="text-blue-600" size={36} /> Command Center
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-1">Authorized Official Panel • Mumbai-Navi Mumbai</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Cases</p>
                <p className="text-2xl font-black text-blue-600">{reports.length}</p>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Accessing Secure Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 relative group">
              
              {/* Delete Button - Absolute Position */}
              <button 
                onClick={() => handleDelete(report.id)}
                className="absolute top-6 right-6 p-3 bg-red-50 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={18} />
              </button>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(report.status)}`}>
                    {report.status || 'Pending'}
                  </div>
                  <div className="text-slate-300 font-bold text-[10px] tracking-tighter">
                    REF ID: #{report.id}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase leading-tight line-clamp-2">{report.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{report.type}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-[9px] font-bold uppercase">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                
                <p className="text-slate-500 text-sm mb-6 line-clamp-3 font-medium leading-relaxed">{report.description}</p>
                
                {report.image_url && (
                    <div className="rounded-3xl overflow-hidden mb-6 border border-slate-50 shadow-inner">
                        <img src={report.image_url} className="w-full h-40 object-cover hover:scale-105 transition-transform duration-700" alt="Attachment" />
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100">
                    <MapPin size={14} className="text-blue-500" /> {report.location}
                  </span>
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100">
                    <ThumbsUp size={14} /> {report.votes || 0} Votes
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Department Response</p>
                  <p className="text-slate-600 text-xs italic font-semibold leading-relaxed">
                    {report.admin_message ? `"${report.admin_message}"` : "Waiting for official acknowledgement..."}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between mb-2 px-2">
                   <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-white text-xs shadow-lg">
                      {report.reporter_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 leading-none">{report.reporter_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Verified Citizen</p>
                    </div>
                   </div>
                   <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Priority</p>
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={12} /> {report.priority || 'Medium'}
                        </span>
                   </div>
                </div>

                {/* Status Update Dropdown */}
                <div className="relative">
                    <select 
                        disabled={updatingId === report.id}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        value={report.status || 'Pending'}
                        className="w-full appearance-none py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-blue-600 transition-all cursor-pointer outline-none shadow-xl shadow-blue-900/10"
                    >
                        <option value="Pending">⚠️ Pending (Red)</option>
                        <option value="In Progress">🚧 In Progress (Yellow)</option>
                        <option value="Resolved">✅ Resolved (Green)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                        <Send size={14} />
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;