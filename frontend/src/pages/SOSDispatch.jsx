import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Shield,
  Clock,
  MapPin,
  AlertCircle,
  Phone,
  Radio,
  Navigation,
  ShieldAlert,
  Flame,
  Stethoscope,
  CheckCircle,
  Activity,
  Zap,
  Info,
  X,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";

const SOSDispatch = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports/all",
      );
      // Filter for Emergency/SOS types via department
      const sosAlerts = res.data.filter(
        (r) => r.department === "SOS" || r.type === "Emergency" || r.title === "SOS ALERT",
      );
      setAlerts(sosAlerts);
    } catch (err) {
      console.error("Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (type) => {
    if (!selectedAlert) return;
    setDispatchStatus(type);

    // Simulate a responding unit starting 1km away
    const [lat, lng] = getCoords(selectedAlert.location);
    const unitLoc = `${(lat + 0.008).toFixed(4)}, ${(lng + 0.008).toFixed(4)}`;
    const eta = 4; // 4 minutes

    try {
      await axios.put(
        `http://localhost:5000/api/admin/dispatch/${selectedAlert.id}`,
        {
          type: type,
          eta: eta,
          unit_location: unitLoc,
        },
      );

      setTimeout(() => {
        setDispatchStatus(null);
        fetchAlerts();
        alert(`${type} Unit Dispatched! ETA: ${eta} mins`);
      }, 1000);
    } catch (err) {
      alert("Dispatch Failed");
      setDispatchStatus(null);
    }
  };

  const resolveAlert = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/reports/${id}`,
        { status: "Resolved", tracking_step: 6 },
      );
      fetchAlerts();
      setSelectedAlert(null);
    } catch (err) {
      alert("Action Failed");
    }
  };

  const getCoords = (loc) => {
    if (!loc) return [19.076, 72.8777];
    const parts = loc.split(",").map(Number);
    return parts.length === 2 ? parts : [19.076, 72.8777];
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      {/* HUD HEADER */}
      <header className="bg-slate-900/50 backdrop-blur-3xl border-b border-white/5 p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-500/20 animate-pulse">
            <Radio size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              Mission Control{" "}
              <span className="text-red-500 underline underline-offset-4">
                SOS Dispatch
              </span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Sector: Mumbai
              Metropolitan Area
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
            ACTIVE OFFICIAL: {JSON.parse(localStorage.getItem("user"))?.dept_id}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: LIVE ALERT FEED */}
        <aside className="w-[450px] bg-slate-900/30 border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAlerts}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center gap-2"
              >
                <Radio size={12} className={loading ? "animate-pulse" : ""} />{" "}
                Force Sync
              </button>
              <span className="text-[9px] font-black px-3 py-1 bg-red-500/10 text-red-500 rounded-full">
                {alerts.length} Distressed Nodes
              </span>
            </div>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedAlert?.id === alert.id ? "bg-red-600 border-red-500 shadow-2xl shadow-red-500/20" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-3 rounded-xl ${selectedAlert?.id === alert.id ? "bg-white/20" : "bg-red-500/10 text-red-500"}`}
                    >
                      <AlertCircle
                        size={20}
                        className={
                          alert.status === "Pending" ? "animate-pulse" : ""
                        }
                      />
                    </div>
                    <div className="text-right">
                      <span
                        className={`block text-[8px] font-black uppercase tracking-widest ${selectedAlert?.id === alert.id ? "text-white" : "text-slate-500"}`}
                      >
                        ID: #{alert.id}
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${selectedAlert?.id === alert.id ? "bg-white/20 text-white" : "bg-red-500/20 text-red-500"}`}
                      >
                        CRITICAL
                      </span>
                    </div>
                  </div>
                  <h4
                    className={`text-lg font-black italic tracking-tight uppercase leading-none mb-2 ${selectedAlert?.id === alert.id ? "text-white" : "text-white"}`}
                  >
                    {alert.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${selectedAlert?.id === alert.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                      {alert.type || "General SOS"}
                    </div>
                    <p
                      className={`text-[10px] font-bold uppercase truncate ${selectedAlert?.id === alert.id ? "text-white/70" : "text-slate-500"}`}
                    >
                      <MapPin size={10} className="inline mr-1" />{" "}
                      {alert.location}
                    </p>
                  </div>

                  {selectedAlert?.id === alert.id && (
                    <div className="absolute right-6 bottom-6 text-white animate-bounce">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <ShieldCheck size={48} className="text-slate-800 mx-auto" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Awaiting new distress nodes...
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER: COMMAND INTERFACE */}
        <main className="flex-1 relative flex flex-col">
          {selectedAlert ? (
            <>
              {/* TACTICAL MAP */}
              <div className="flex-1 bg-slate-800 relative group">
                <MapContainer
                  center={getCoords(selectedAlert.location)}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  key={selectedAlert.id}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Circle
                    center={getCoords(selectedAlert.location)}
                    radius={300}
                    pathOptions={{
                      color: "red",
                      fillColor: "red",
                      fillOpacity: 0.1,
                    }}
                  />
                  <Marker position={getCoords(selectedAlert.location)}>
                    <Popup>
                      <span className="font-black text-xs uppercase">
                        Distress Node: {selectedAlert.id}
                      </span>
                    </Popup>
                  </Marker>
                </MapContainer>

                {/* ALERT INFO OVERLAY */}
                <div className="absolute top-10 left-10 z-[1000] bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 w-96 shadow-2xl">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={12} /> Target Metadata
                  </p>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">
                    {selectedAlert.reporter_name || "Anonymous Citizen"}
                  </h3>
                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                        Coordinated Address
                      </p>
                      <p className="text-xs font-bold text-white leading-relaxed">
                        {selectedAlert.location}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                        Status Report
                      </p>
                      <p className="text-xs font-bold text-slate-300 italic">
                        "Panic button triggered via mobile app. Citizen requires
                        immediate tactical support."
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => resolveAlert(selectedAlert.id)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    <CheckCircle size={16} /> Mark as Resolved
                  </button>
                </div>
              </div>

              {/* DISPATCH ACTION BAR */}
              <div className="bg-slate-900/80 backdrop-blur-3xl border-t border-white/10 p-10 flex gap-8 items-center justify-center z-50">
                <DispatchButton
                  label="Deploy Police"
                  num="100"
                  icon={<ShieldAlert size={32} />}
                  color="bg-blue-600"
                  onClick={() => handleDispatch("Tactical Police")}
                  loading={dispatchStatus === "Tactical Police"}
                />
                <DispatchButton
                  label="Deploy Fire"
                  num="101"
                  icon={<Flame size={32} />}
                  color="bg-orange-600"
                  onClick={() => handleDispatch("Fire Response")}
                  loading={dispatchStatus === "Fire Response"}
                />
                <DispatchButton
                  label="Deploy Medical"
                  num="108"
                  icon={<Stethoscope size={32} />}
                  color="bg-emerald-600"
                  onClick={() => handleDispatch("Emergency Medical")}
                  loading={dispatchStatus === "Emergency Medical"}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="p-12 bg-white/5 rounded-[4rem] border border-white/5 animate-pulse">
                <Radio size={80} className="text-slate-800" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  Awaiting Signal
                </h2>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-3">
                  Select a node from the live feed to begin tactical dispatch
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const DispatchButton = ({ label, num, icon, color, onClick, loading }) => (
  <button
    onClick={onClick}
    className={`flex-1 max-w-[280px] p-8 rounded-[2.5rem] flex items-center justify-between group transition-all active:scale-95 shadow-2xl ${color} text-white`}
  >
    <div className="text-left">
      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">
        {label}
      </p>
      <h4 className="text-4xl font-black italic tracking-tighter">{num}</h4>
    </div>
    <div className="p-5 bg-white/20 rounded-3xl group-hover:scale-110 transition-transform">
      {loading ? <Loader2 size={32} className="animate-spin" /> : icon}
    </div>
  </button>
);

export default SOSDispatch;
