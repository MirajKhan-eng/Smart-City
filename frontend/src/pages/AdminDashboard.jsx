import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Shield,
  Clock,
  MapPin,
  ThumbsUp,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Send,
  Briefcase,
  Filter,
  BarChart3,
  Activity,
  PieChart,
  Users,
  ChevronRight,
  Search,
  AlertCircle,
} from "lucide-react";

const TRACKING_STEPS = [
  { id: 1, label: "Reported", color: "bg-slate-500" },
  { id: 2, label: "Dept Assigned", color: "bg-blue-500" },
  { id: 3, label: "Site Inspection", color: "bg-indigo-500" },
  { id: 4, label: "Work in Progress", color: "bg-amber-500" },
  { id: 5, label: "Final Inspection", color: "bg-emerald-500" },
  { id: 6, label: "Resolved", color: "bg-green-600" },
];

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        axios.get("https://smart-city-1-42tj.onrender.com/api/reports/all"),
        axios.get("https://smart-city-1-42tj.onrender.com/api/admin/analytics"),
      ]);
      setReports(reportsRes.data);
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
      await axios.put(
        `https://smart-city-1-42tj.onrender.com/api/admin/reports/${id}`,
        data,
      );
      fetchData();
    } catch (err) {
      alert("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    if (activeTab === "All") return reports;
    return reports.filter((r) => r.department === activeTab);
  }, [reports, activeTab]);

  const getPriorityColor = (p) => {
    if (p === "High") return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (p === "Medium")
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans p-4 md:p-10">
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
              <Shield className="text-blue-500 w-12 h-12" /> COMMAND CENTER
            </h1>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Administrative
              Authority Dashboard
            </p>
          </div>
          {analytics && (
            <div className="flex gap-4">
              <AnalyticsCard
                label="Pending"
                val={analytics.pending}
                icon={<Clock />}
                color="text-rose-500"
              />
              <AnalyticsCard
                label="Resolved"
                val={analytics.resolved}
                icon={<CheckCircle />}
                color="text-emerald-500"
              />
              <AnalyticsCard
                label="Active Load"
                val={analytics.total}
                icon={<Activity />}
                color="text-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {analytics && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                <BarChart3 className="text-blue-500" /> Departmental Traffic
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {Object.entries(analytics.departments).map(([dept, count]) => (
                <div
                  key={dept}
                  className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => setActiveTab(dept)}
                >
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {dept}
                  </p>
                  <div className="text-3xl font-black text-white italic">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl">
            <div>
              <h3 className="text-white font-black text-2xl uppercase italic leading-tight mb-4 text-center">
                System Efficiency
              </h3>
            </div>
            <div className="text-8xl font-black text-white italic py-4 text-center">
              {Math.round((analytics.resolved / (analytics.total || 1)) * 100)}%
            </div>
            <button className="w-full py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
              Download Audit Report
            </button>
          </div>
        </div>
      )}

      {/* Dept Tabs */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-wrap gap-3">
        {["All", "PWD", "Waste", "Environment", "Traffic", "Water"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === tab ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"}`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Reports Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 flex flex-col lg:flex-row gap-10 hover:border-blue-500/20 transition-all group"
            >
              {/* Visual Evidence */}
              <div className="w-full lg:w-1/3">
                {report.image_url ? (
                  <div className="h-full min-h-[250px] rounded-[2.5rem] overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
                    <img
                      src={report.image_url}
                      className="w-full h-full object-cover"
                      alt="Evidence"
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-[250px] rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-700">
                    <PieChart size={48} />
                  </div>
                )}
              </div>

              {/* Content & Progress */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(report.priority)}`}
                    >
                      {report.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                      {report.department} Dept
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
                  {report.title}
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed max-w-2xl">
                  {report.description}
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <span className="flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-300 uppercase border border-white/5">
                    <MapPin size={14} className="text-blue-500" />{" "}
                    {report.location}
                  </span>
                </div>

                {/* STEPPER UI */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Operational Pipeline
                    </p>
                    <p className="text-[10px] font-black text-blue-500 uppercase">
                      {TRACKING_STEPS[report.tracking_step - 1].label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {TRACKING_STEPS.map((step) => (
                      <div
                        key={step.id}
                        onClick={() =>
                          handleUpdate(report.id, {
                            tracking_step: step.id,
                            status: step.id === 6 ? "Resolved" : "In Progress",
                          })
                        }
                        className={`flex-1 h-3 rounded-full cursor-pointer transition-all ${report.tracking_step >= step.id ? step.color : "bg-white/5"}`}
                        title={step.label}
                      />
                    ))}
                  </div>
                </div>

                {/* ADMIN ACTIONS */}
                <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                  <div className="flex-1">
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-3 ml-2">
                      Official Update Message
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type progress update..."
                        className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleUpdate(report.id, {
                              admin_message: e.target.value,
                            });
                        }}
                        defaultValue={report.admin_message}
                      />
                      <button className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-3 ml-2">
                      Change Priority
                    </label>
                    <select
                      className="w-full bg-slate-900 border border-white/10 text-[9px] font-black uppercase text-white p-4 rounded-2xl outline-none cursor-pointer"
                      value={report.priority}
                      onChange={(e) =>
                        handleUpdate(report.id, { priority: e.target.value })
                      }
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
    </div>
  );
};

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

export default AdminDashboard;
