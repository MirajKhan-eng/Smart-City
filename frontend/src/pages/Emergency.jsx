import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  AlertOctagon,
  Phone,
  MapPin,
  ShieldAlert,
  Stethoscope,
  Flame,
  Navigation,
  ChevronRight,
  ShieldCheck,
  User,
  Heart,
  Info,
  X,
  AlertCircle,
  Zap,
  Shield,
  Camera,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";

const Emergency = () => {
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  const [showMedicalId, setShowMedicalId] = useState(false);
  const timerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  // Mock Medical Data
  const medicalId = {
    blood: "B+",
    allergies: "Penicillin, Dust",
    conditions: "Hypertension",
    emergencyContact: "Mom: 98200XXXXX",
  };

  const startSOSCountdown = () => {
    setCountdown(3);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(timerRef.current);
    setCountdown(null);
  };

  const [lastSosId, setLastSosId] = useState(localStorage.getItem("lastSosId"));
  const [dispatchInfo, setDispatchInfo] = useState(null);

  useEffect(() => {
    let interval;
    if (sosActive && lastSosId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/reports/all`,
          );
          const mySos = res.data.find((r) => r.id === parseInt(lastSosId));
          if (mySos && mySos.dispatch_type) {
            setDispatchInfo({
              type: mySos.dispatch_type,
              eta: mySos.eta,
              pos: mySos.unit_location?.split(",").map(Number),
            });
          }
          if (mySos && mySos.status === "Resolved") {
            setSosActive(false);
            setLastSosId(null);
            localStorage.removeItem("lastSosId");
            alert("Emergency Resolved. Stay Safe.");
          }
        } catch (err) {
          console.error("Tracking failed");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [sosActive, lastSosId]);

  const [guardian, setGuardian] = useState(
    user?.guardian_name
      ? { name: user.guardian_name, phone: user.guardian_phone }
      : null,
  );
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [tempGuardian, setTempGuardian] = useState({ name: "", phone: "" });

  const saveGuardian = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        {
          guardian_name: tempGuardian.name,
          guardian_phone: tempGuardian.phone,
        },
      );
      setGuardian(tempGuardian);
      setShowGuardianModal(false);
      alert("Guardian Integrated Successfully");
    } catch (err) {
      alert("Failed to save guardian");
    }
  };

  const triggerSOS = async (type = "Emergency") => {
    setSosActive(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        fetchNearbyFacilities(loc);

        // Notify Guardian
        if (guardian) {
          console.log(
            `📡 NOTIFYING GUARDIAN ${guardian.name}: SOS AT ${loc.lat}, ${loc.lng}`,
          );
          // In a real app, this sends an SMS
        }

        try {
          const res = await axios.post(
            "http://localhost:5000/api/emergency/sos",
            {
              user_id: user.id,
              location: loc,
              type: type, // 'Police', 'Fire', 'Medical' or 'Emergency'
            },
          );
          const newId = res.data.report?.id;
          if (newId) {
            setLastSosId(newId);
            localStorage.setItem("lastSosId", newId);
          }
        } catch (err) {
          console.error("SOS Broadcast Failed");
        }
      });
    }
  };

  const fetchNearbyFacilities = async (loc) => {
    // In a real app, this would query OSM or a backend
    setNearbyFacilities([
      {
        id: 1,
        name: "Apex Multi-speciality Hospital",
        type: "hospital",
        pos: [loc.lat + 0.005, loc.lng + 0.005],
        dist: "400m",
      },
      {
        id: 2,
        name: "City Police Station (Sector 4)",
        type: "police",
        pos: [loc.lat - 0.003, loc.lng + 0.002],
        dist: "900m",
      },
      {
        id: 3,
        name: "Fire Response Unit 12",
        type: "fire",
        pos: [loc.lat + 0.008, loc.lng - 0.001],
        dist: "1.2km",
      },
    ]);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${sosActive ? "bg-red-950" : "bg-slate-50"} p-4 md:p-10 font-sans`}
    >
      <div className="max-w-6xl mx-auto">
        {/* HEADER AREA */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1
              className={`text-4xl font-black italic tracking-tighter uppercase ${sosActive ? "text-red-500" : "text-slate-900"}`}
            >
              SOS Command Center
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
              Authorized Emergency Response v4.0
            </p>
          </div>
          <button
            onClick={() => setShowMedicalId(true)}
            className={`p-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${sosActive ? "bg-red-600 text-white shadow-2xl" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            <Shield size={16} /> My Life Card
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SOS CORE PANEL */}
          <div className="lg:col-span-2 space-y-8">
            {!sosActive ? (
              <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                    <AlertOctagon
                      size={48}
                      className="text-red-600 animate-pulse"
                    />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">
                    Immediate Assistance?
                  </h2>
                  <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                    Hold the button for 3 seconds to broadcast your live
                    location to emergency responders and your guardians.
                  </p>

                  <button
                    onMouseDown={startSOSCountdown}
                    onMouseUp={cancelSOS}
                    onTouchStart={startSOSCountdown}
                    onTouchEnd={cancelSOS}
                    className="relative w-48 h-48 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-200 active:scale-95 transition-all border-8 border-red-500/20"
                  >
                    {countdown ? (
                      <span className="text-7xl font-black text-white italic">
                        {countdown}
                      </span>
                    ) : (
                      <Zap size={64} className="text-white fill-white" />
                    )}
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                  </button>
                  <p className="mt-8 text-[10px] font-black text-red-600 uppercase tracking-widest">
                    Hold to Signal
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] -mr-32 -mt-32"></div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-[3rem] p-10 border border-red-500/30 animate-in zoom-in duration-500 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                  <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                      <Activity size={14} /> Critical SOS Broadcast Active
                    </div>
                    <h2 className="text-5xl font-black text-white italic leading-tight uppercase tracking-tighter">
                      Responders Notified
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                      Your precise coordinates have been encrypted and
                      transmitted to the Mumbai City Central Dispatch & 3
                      registered guardians.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <StatusTab
                        label="GPS Status"
                        val="Broadcasting"
                        color="text-green-500"
                      />
                      <StatusTab
                        label="Guardian"
                        val="Notified"
                        color="text-green-500"
                      />
                      <StatusTab
                        label="Dispatch"
                        val={dispatchInfo ? dispatchInfo.type : "Awaiting..."}
                        color={
                          dispatchInfo ? "text-green-500" : "text-amber-500"
                        }
                      />
                      <StatusTab
                        label="ETA"
                        val={
                          dispatchInfo
                            ? `${dispatchInfo.eta} Mins`
                            : "Calculating..."
                        }
                        color="text-blue-500"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-80 h-80 rounded-[2.5rem] bg-slate-800 border border-slate-700 overflow-hidden relative">
                    {location && (
                      <MapContainer
                        center={[location.lat, location.lng]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Circle
                          center={[location.lat, location.lng]}
                          radius={200}
                          pathOptions={{
                            color: "red",
                            fillColor: "red",
                            fillOpacity: 0.2,
                          }}
                        />

                        {/* USER MARKER */}
                        <Marker position={[location.lat, location.lng]}>
                          <Popup>My Location</Popup>
                        </Marker>

                        {/* DISPATCH UNIT MARKER */}
                        {dispatchInfo && dispatchInfo.pos && (
                          <Marker position={dispatchInfo.pos}>
                            <Popup className="font-black uppercase text-xs">
                              {dispatchInfo.type} Unit Approaching
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    )}
                    <div className="absolute top-4 right-4 z-[1000] p-2 bg-red-600 text-white rounded-lg shadow-lg">
                      <Navigation
                        size={16}
                        className={
                          dispatchInfo ? "animate-bounce" : "animate-spin"
                        }
                      />
                    </div>
                  </div>
                </div>

                {dispatchInfo && (
                  <div className="mt-8 bg-blue-600 p-6 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-4">
                    <div>
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                        Active Response Unit
                      </p>
                      <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">
                        {dispatchInfo.type} Team En Route
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                        Est. Arrival
                      </p>
                      <h4 className="text-3xl font-black text-white italic tracking-tighter">
                        {dispatchInfo.eta}m
                      </h4>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSosActive(false)}
                  className="mt-10 w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  False Alarm / Cancel SOS
                </button>
              </div>
            )}

            {/* QUICK AID GUIDES */}
            <div
              className={`${sosActive ? "bg-white/5 border-white/5" : "bg-white border-slate-100"} rounded-[3rem] p-10 border shadow-sm`}
            >
              <h3
                className={`text-xl font-black uppercase italic flex items-center gap-3 mb-8 ${sosActive ? "text-white" : "text-slate-900"}`}
              >
                <ShieldCheck className="text-emerald-500" /> Emergency First Aid
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AidCard
                  title="Cardiac Arrest"
                  steps={[
                    "Call 108",
                    "Start Chest Compressions",
                    "Use AED if available",
                  ]}
                />
                <AidCard
                  title="Choking (Heimlich)"
                  steps={[
                    "Lean person forward",
                    "5 sharp back blows",
                    "5 abdominal thrusts",
                  ]}
                />
                <AidCard
                  title="Severe Bleeding"
                  steps={[
                    "Apply direct pressure",
                    "Elevate the limb",
                    "Use tourniquet if trained",
                  ]}
                />
                <AidCard
                  title="Heat Stroke"
                  steps={[
                    "Move to cool area",
                    "Apply cold packs",
                    "Do not give liquids",
                  ]}
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR: CONTACTS & NEARBY */}
          <div className="space-y-8">
            {/* DIRECT ACTION BUTTONS */}
            <div className="grid grid-cols-1 gap-4">
              <EmergencyContact
                label="Police"
                num="100"
                icon={<ShieldAlert className="text-blue-500" />}
                bg="bg-blue-600"
                onClick={() => triggerSOS("Police")}
              />
              <EmergencyContact
                label="Ambulance"
                num="108"
                icon={<Stethoscope className="text-emerald-500" />}
                bg="bg-emerald-600"
                onClick={() => triggerSOS("Medical")}
              />
              <EmergencyContact
                label="Fire"
                num="101"
                icon={<Flame className="text-orange-500" />}
                bg="bg-orange-600"
                onClick={() => triggerSOS("Fire")}
              />
            </div>

            {/* NEARBY FACILITIES LIST */}
            <div
              className={`${sosActive ? "bg-white/5 border-white/5" : "bg-white border-slate-100"} rounded-[3rem] p-8 border shadow-sm`}
            >
              <h4
                className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${sosActive ? "text-slate-400" : "text-slate-500"}`}
              >
                Local Response Units
              </h4>
              <div className="space-y-4">
                {nearbyFacilities.length > 0 ? (
                  nearbyFacilities.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                          {f.type === "hospital" ? (
                            <Heart size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">
                            {f.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">
                            {f.dist}
                          </p>
                        </div>
                      </div>
                      <Navigation size={14} className="text-slate-600" />
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-slate-700 animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                      Scanning for nearest medical & tactical units...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SAFETY BANNER */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <ShieldCheck className="w-20 h-20 absolute -right-4 -bottom-4 text-white/10" />
              <h5 className="text-lg font-black italic uppercase leading-tight mb-2">
                Guardian Network
              </h5>
              {guardian ? (
                <div className="mb-6">
                  <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">
                    {guardian.name}
                  </p>
                  <p className="text-[10px] text-blue-200 font-medium">
                    {guardian.phone}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-blue-100 font-medium mb-6">
                  No guardians linked. Add a contact to alert them during SOS.
                </p>
              )}
              <button
                onClick={() => setShowGuardianModal(true)}
                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
              >
                {guardian ? "Manage Guardian" : "Integrate Guardian"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GUARDIAN MODAL */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl">
            <button
              onClick={() => setShowGuardianModal(false)}
              className="absolute top-6 right-6 p-3 bg-slate-100 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
                <User size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">
                Safety Circle
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Authorized Guardian Integration
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Guardian Name
                </label>
                <input
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:border-indigo-500"
                  placeholder="e.g. John Doe"
                  value={tempGuardian.name}
                  onChange={(e) =>
                    setTempGuardian({ ...tempGuardian, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Emergency Phone
                </label>
                <input
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:border-indigo-500"
                  placeholder="+91 XXXXX XXXXX"
                  value={tempGuardian.phone}
                  onChange={(e) =>
                    setTempGuardian({ ...tempGuardian, phone: e.target.value })
                  }
                />
              </div>
              <button
                onClick={saveGuardian}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200"
              >
                Securely Integrate Guardian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDICAL ID MODAL */}
      {showMedicalId && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl">
            <button
              onClick={() => setShowMedicalId(false)}
              className="absolute top-6 right-6 p-3 bg-slate-100 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Heart size={40} className="text-white fill-white" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">
                Life Card
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Official Medical Identity
              </p>
            </div>

            <div className="space-y-4">
              <MedicalField
                label="Blood Type"
                val={medicalId.blood}
                color="text-red-600"
              />
              <MedicalField label="Known Allergies" val={medicalId.allergies} />
              <MedicalField
                label="Chronic Conditions"
                val={medicalId.conditions}
              />
              <MedicalField
                label="Primary Guardian"
                val={medicalId.emergencyContact}
              />
            </div>

            <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
              <Info className="text-blue-500 shrink-0" />
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                First responders can access this card from your lock screen in
                an emergency.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusTab = ({ label, val, color }) => (
  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
      {label}
    </p>
    <p className={`text-xs font-black uppercase tracking-widest ${color}`}>
      {val}
    </p>
  </div>
);

const AidCard = ({ title, steps }) => (
  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group">
    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-4 flex justify-between items-center">
      {title}{" "}
      <ChevronRight
        size={14}
        className="text-slate-400 group-hover:translate-x-1 transition-transform"
      />
    </h4>
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[9px] font-black text-blue-500">{i + 1}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase">{s}</p>
        </div>
      ))}
    </div>
  </div>
);

const EmergencyContact = ({ label, num, icon, bg }) => (
  <button className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
    <div className="flex items-center gap-5">
      <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-red-50 transition-colors">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
          {num}
        </h3>
      </div>
    </div>
    <div className={`p-4 ${bg} text-white rounded-2xl shadow-lg`}>
      <Phone size={24} />
    </div>
  </button>
);

const MedicalField = ({ label, val, color = "text-slate-900" }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-100">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span className={`text-sm font-black italic uppercase ${color}`}>
      {val}
    </span>
  </div>
);

export default Emergency;
