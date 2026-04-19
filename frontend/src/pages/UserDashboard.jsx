import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  Circle
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Users, 
  MapPin, 
  Search, 
  Navigation, 
  Heart, 
  Shield, 
  CreditCard, 
  Fuel,
  TrendingUp,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Calendar,
  MessageSquare,
  BarChart3,
  BusFront,
  AlertOctagon
} from 'lucide-react';

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for different categories
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  hospital: createIcon('red'),
  police: createIcon('blue'),
  atm: createIcon('green'),
  petrol: createIcon('orange'),
  user: createIcon('violet')
};

// Mock data for Mumbai/Navi Mumbai
const locations = [
  { id: 1, type: 'hospital', name: 'Kokilaben Dhirubhai Ambani Hospital', pos: [19.1314, 72.8258] },
  { id: 2, type: 'hospital', name: 'Fortis Hospital, Mulund', pos: [19.1764, 72.9463] },
  { id: 3, type: 'hospital', name: 'Apollo Hospitals, Navi Mumbai', pos: [19.0191, 73.0182] },
  { id: 4, type: 'police', name: 'Vashi Police Station', pos: [19.0748, 72.9978] },
  { id: 5, type: 'police', name: 'Andheri Police Station', pos: [19.1136, 72.8697] },
  { id: 6, type: 'atm', name: 'HDFC Bank ATM, BKC', pos: [19.0667, 72.8667] },
  { id: 7, type: 'atm', name: 'SBI ATM, Dadar', pos: [19.0178, 72.8478] },
  { id: 8, type: 'petrol', name: 'BPCL Petrol Pump, Chembur', pos: [19.0622, 72.8974] },
  { id: 9, type: 'petrol', name: 'HP Fuel Station, Navi Mumbai', pos: [19.0473, 73.0201] },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [filter, setFilter] = useState('all');
  const [userPos, setUserPos] = useState([19.0760, 72.8777]); // Default Mumbai center
  const [hasLocation, setHasLocation] = useState(false);
  const [stats, setStats] = useState({
    temp: '32°C',
    aqi: '112',
    humidity: '65%',
    population: '21.6M'
  });

  const [prices, setPrices] = useState({
    gold: { value: '72,450', change: '+0.5%' },
    silver: { value: '85,200', change: '-0.2%' },
    petrol: { value: '104.21', change: '0.0%' },
    diesel: { value: '92.15', change: '0.0%' }
  });

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        temp: (30 + Math.floor(Math.random() * 5)) + '°C',
        aqi: (100 + Math.floor(Math.random() * 30)).toString()
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setHasLocation(true);
      });
    }
  };

  const filteredLocations = filter === 'all' 
    ? locations 
    : locations.filter(loc => loc.type === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* Welcome & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome, {user?.name || 'Citizen'}</h1>
          <p className="text-gray-500 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
            <button className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm border border-red-100 flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-50" onClick={() => navigate('/emergency')}>
                <AlertOctagon className="w-5 h-5" /> EMERGENCY SOS
            </button>
            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
            <button 
                onClick={handleLocateUser}
                className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl"
            >
                <Navigation className="w-4 h-4" /> Live Location
            </button>
        </div>
      </div>

      {/* Real-time Status Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard icon={<Thermometer className="w-6 h-6 text-orange-500" />} label="Temperature" value={stats.temp} desc="Normal Range" trend="+2° Today" />
        <StatusCard icon={<Wind className="w-6 h-6 text-green-500" />} label="AQI Level" value={stats.aqi} desc="Moderate" trend="Stable" />
        <StatusCard icon={<Droplets className="w-6 h-6 text-blue-500" />} label="Humidity" value={stats.humidity} desc="Sea Breeze" trend="Normal" />
        <StatusCard icon={<Users className="w-6 h-6 text-purple-500" />} label="Total Population" value={stats.population} desc="Mumbai Metro" trend="Growing" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Services Nearby</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Mumbai & Navi Mumbai</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} icon={<Search className="w-3 h-3" />} label="All" />
                    <FilterButton active={filter === 'hospital'} onClick={() => setFilter('hospital')} icon={<Heart className="w-3 h-3" />} label="Med" />
                    <FilterButton active={filter === 'police'} onClick={() => setFilter('police')} icon={<Shield className="w-3 h-3" />} label="Sec" />
                    <FilterButton active={filter === 'atm'} onClick={() => setFilter('atm')} icon={<CreditCard className="w-3 h-3" />} label="ATM" />
                    <FilterButton active={filter === 'petrol'} onClick={() => setFilter('petrol')} icon={<Fuel className="w-3 h-3" />} label="Fuel" />
                </div>
            </div>

            <div className="h-[450px] w-full rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
              <MapContainer center={userPos} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater center={userPos} />
                {filteredLocations.map(loc => (
                  <Marker key={loc.id} position={loc.pos} icon={icons[loc.type]}>
                    <Popup><h4 className="font-bold">{loc.name}</h4></Popup>
                  </Marker>
                ))}
                {hasLocation && (
                    <>
                        <Marker position={userPos} icon={icons.user}><Popup><b>You</b></Popup></Marker>
                        <Circle center={userPos} radius={2000} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
                    </>
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Feature Queue & Economic Stats */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6">Quick Access</h3>
            <div className="grid grid-cols-1 gap-3">
                <ServiceLink 
                    onClick={() => navigate('/report-issue')} 
                    icon={<MessageSquare className="w-5 h-5 text-blue-500" />} 
                    title="Civic Complaints" 
                    desc="Report Potholes, Streetlights, etc." 
                />
                <ServiceLink 
                    onClick={() => navigate('/livability')} 
                    icon={<BarChart3 className="w-5 h-5 text-emerald-500" />} 
                    title="Livability Score" 
                    desc="Check Area-wise Ratings" 
                />
                <ServiceLink 
                    onClick={() => navigate('/traffic-routes')} 
                    icon={<BusFront className="w-5 h-5 text-orange-500" />} 
                    title="Transportation" 
                    desc="Plan your commute" 
                />
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <h3 className="text-xl font-black mb-6">Market Trends</h3>
            <div className="space-y-4">
              <PriceRow title="Gold (24K/10g)" value={`₹${prices.gold.value}`} trend={prices.gold.change} isUp={true} />
              <PriceRow title="Silver (1kg)" value={`₹${prices.silver.value}`} trend={prices.silver.change} isUp={false} />
              <PriceRow title="Petrol (1L)" value={`₹${prices.petrol.value}`} trend={prices.petrol.change} isUp={true} />
              <PriceRow title="Diesel (1L)" value={`₹${prices.diesel.value}`} trend={prices.diesel.change} isUp={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helpers
const StatusCard = ({ icon, label, value, desc, trend }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-lg transition-all">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      </div>
    </div>
    <div className="flex justify-between items-center text-[10px] font-bold">
      <span className="text-gray-400">{desc}</span>
      <span className="text-blue-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {trend}</span>
    </div>
  </div>
);

const PriceRow = ({ title, value, trend, isUp }) => (
  <div className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-all">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-lg font-black">{value}</h4>
    </div>
    <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{trend}</div>
  </div>
);

const ServiceLink = ({ icon, title, desc, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] border border-gray-50 hover:border-blue-100 hover:bg-blue-50/50 transition-all text-left group"
    >
        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <div>
            <h4 className="font-bold text-gray-900 leading-none mb-1">{title}</h4>
            <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </button>
);

const FilterButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all ${
      active ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
    }`}
  >
    {icon} {label}
  </button>
);

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, map.getZoom()); }, [center, map]);
  return null;
};

export default UserDashboard;