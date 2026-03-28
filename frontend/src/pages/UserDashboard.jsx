import React from 'react';
import { CloudIcon, ExclamationTriangleIcon, TruckIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Message */}
      <section>
        <h1 className="text-3xl font-black text-gray-900">Good Morning, {user.name}</h1>
        <p className="text-gray-500 font-medium">Here’s what’s happening in Mumbai-Navi Mumbai today.</p>
      </section>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<CloudIcon className="w-6 h-6 text-blue-500"/>} label="Temp" value="31°C" desc="Cloudy Sky" />
        <StatCard icon={<ChartBarIcon className="w-6 h-6 text-green-500"/>} label="AQI" value="120" desc="Moderate" />
        <StatCard icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-500"/>} label="Issues" value="24" desc="Active Near You" />
        <StatCard icon={<TruckIcon className="w-6 h-6 text-purple-500"/>} label="Traffic" value="Heavy" desc="Western Express" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Overview Map (Heatmap Image) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 uppercase tracking-tight">Live City Heatmap</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full italic">Real-time Data</span>
            </div>
            
            {/* Heatmap Image Placeholder */}
            <div className="relative rounded-2xl overflow-hidden h-80 bg-gray-100 group">
              <img 
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
                alt="City Heatmap" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlaying a fake "Heat" effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-red-500/40 rounded-full blur-3xl"></div>
              <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-yellow-400/30 rounded-full blur-3xl"></div>
              
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase">Current Focus</p>
                <p className="text-sm font-bold text-gray-800">Andheri West - High Traffic</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-48 flex items-center justify-center border-dashed border-2">
            <p className="text-gray-400 font-bold italic">Interactive Activity Chart coming soon...</p>
          </div>
        </div>

        {/* Right: Emergency & Actions */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6 uppercase tracking-tight">Quick Actions</h3>
            <div className="space-y-3">
              <ActionButton label="Report a Pothole" icon="🕳️" color="hover:bg-blue-50" />
              <ActionButton label="Streetlight Issue" icon="💡" color="hover:bg-yellow-50" />
              <ActionButton label="Waste Management" icon="♻️" color="hover:bg-green-50" />
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm">
            <h3 className="font-black text-red-600 mb-4 uppercase tracking-tight">Emergency SOS</h3>
            <p className="text-xs text-red-500 mb-6 font-medium">Instantly notify the nearest local authorities.</p>
            <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200 active:scale-95 transition-all">
              ACTIVATE SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ icon, label, value, desc }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-xl font-black text-gray-800">{value}</h4>
      <p className="text-[10px] text-gray-500 font-bold">{desc}</p>
    </div>
  </div>
);

const ActionButton = ({ label, icon, color }) => (
  <button className={`w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-50 transition-all font-bold text-gray-700 shadow-sm ${color}`}>
    <span className="text-xl">{icon}</span> {label}
  </button>
);

export default UserDashboard;