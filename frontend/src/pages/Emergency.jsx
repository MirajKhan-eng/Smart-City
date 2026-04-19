import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  Stethoscope, 
  Flame, 
  Navigation,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const Emergency = () => {
  const [sosActive, setSosActive] = useState(false);
  const [locationSent, setLocationSent] = useState(false);

  const handleSOS = () => {
    setSosActive(true);
    // Simulate sending location
    setTimeout(() => setLocationSent(true), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-red-600 tracking-tighter italic uppercase">Emergency SOS Hub</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Immediate response for Mumbai & Navi Mumbai</p>
      </div>

      {/* Primary SOS Button */}
      <section className="relative">
        {!sosActive ? (
          <button 
            onClick={handleSOS}
            className="w-full aspect-square md:aspect-auto md:h-80 bg-red-600 rounded-[3rem] shadow-2xl shadow-red-200 flex flex-col items-center justify-center text-white group hover:bg-red-700 transition-all active:scale-95 border-8 border-red-500/20"
          >
            <div className="p-8 bg-white/20 rounded-full mb-6 animate-pulse">
              <AlertOctagon size={80} strokeWidth={2.5} />
            </div>
            <h2 className="text-5xl font-black tracking-tighter italic">ACTIVATE SOS</h2>
            <p className="mt-4 font-bold text-red-100 opacity-80 uppercase tracking-widest">One-tap authority notification</p>
          </button>
        ) : (
          <div className="w-full md:h-80 bg-gray-900 rounded-[3rem] flex flex-col items-center justify-center text-white p-12 border-8 border-gray-800 animate-in zoom-in duration-300">
            <div className="relative">
                <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <ShieldAlert size={80} className="text-red-500 mb-6 relative z-10" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Emergency Services Notified</h2>
            <p className="text-gray-400 font-medium text-center max-w-sm mb-8">
                Your location data and profile have been transmitted to the nearest response unit.
            </p>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${locationSent ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Location Sent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">ID Verified</span>
                </div>
            </div>
          </div>
        )}
      </section>

      {/* Direct Contact Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EmergencyCard 
            icon={<ShieldAlert className="text-blue-600" />} 
            title="Police Control" 
            number="100" 
            desc="Law enforcement & security"
            color="bg-blue-50"
        />
        <EmergencyCard 
            icon={<Stethoscope className="text-emerald-600" />} 
            title="Ambulance" 
            number="108" 
            desc="Medical emergencies"
            color="bg-emerald-50"
        />
        <EmergencyCard 
            icon={<Flame className="text-orange-600" />} 
            title="Fire Brigade" 
            number="101" 
            desc="Fire & rescue operations"
            color="bg-orange-50"
        />
      </section>

      {/* Safety Instructions */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-green-500" /> Immediate Safety Steps
        </h3>
        <div className="space-y-4">
            <InstructionStep num="01" text="Stay calm and find a safe, visible location if possible." />
            <InstructionStep num="02" text="Keep your phone unlocked and ensure GPS is active." />
            <InstructionStep num="03" text="Watch for automated SMS from 'MUM-SMART' with rescue ID." />
        </div>
      </div>

    </div>
  );
};

const EmergencyCard = ({ icon, title, number, desc, color }) => (
    <button className={`p-8 rounded-[2.5rem] ${color} border border-white shadow-sm hover:shadow-xl transition-all text-left group`}>
        <div className="p-4 bg-white rounded-2xl w-14 h-14 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 font-medium mb-4">{desc}</p>
        <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-gray-900 tracking-tighter italic">{number}</span>
            <div className="p-3 bg-gray-900 text-white rounded-xl">
                <Phone size={18} />
            </div>
        </div>
    </button>
);

const InstructionStep = ({ num, text }) => (
    <div className="flex gap-4 items-start p-4 rounded-2xl hover:bg-gray-50 transition-colors">
        <span className="text-2xl font-black text-blue-200 tracking-tighter italic">{num}</span>
        <p className="text-sm font-bold text-gray-600 leading-relaxed">{text}</p>
    </div>
);

export default Emergency;
