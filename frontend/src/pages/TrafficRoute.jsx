import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- COMPONENT: REAL-TIME ROTATION & GPS FOLLOW ---
function LiveNavigation({ position, heading }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 17); // Zoomed in for navigation
    const container = map.getContainer();
    // GTA Style: The map rotates around the user
    container.style.transform = `rotate(${-heading}deg)`;
    container.style.transition = "transform 0.2s linear";
  }, [position, heading, map]);
  return null;
}

const TrafficRoute = () => {
  // Default to Vashi, Navi Mumbai until GPS loads
  const [userPos, setUserPos] = useState([19.0330, 73.0297]);
  const [heading, setHeading] = useState(0);
  const [showRoute, setShowRoute] = useState(false);

  // --- 1. GET REAL GPS LOCATION ---
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    const handleOrientation = (e) => {
      const compass = e.webkitCompassHeading || (360 - e.alpha);
      if (compass) setHeading(compass);
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  // --- 2. STRICT MUMBAI BOUNDARIES (User cannot scroll out) ---
  const mumbaiBounds = [
    [18.89, 72.75], // Bottom Left (Colaba/Alibaug edge)
    [19.25, 73.15]  // Top Right (Thane/Kharghar edge)
  ];

  // --- 3. CLEAN TRAFFIC DATA (Example Path: Sion to Vashi) ---
  const trafficPath = [
    { coords: [[19.0400, 72.8850], [19.0480, 72.9150]], color: "#22c55e" }, // Green (Clear)
    { coords: [[19.0480, 72.9150], [19.0550, 72.9400]], color: "#eab308" }, // Yellow (Moderate)
    { coords: [[19.0550, 72.9400], [19.0350, 73.0300]], color: "#ef4444" }  // Red (Heavy - Vashi Bridge)
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INPUT CARD */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-blue-900 mb-1 tracking-tight">Mumbai Smart-Route</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase mb-6">Live Traffic & GPS Tracking</p>
          
          <div className="space-y-3">
            <input type="text" placeholder="Start: Current Location" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" disabled />
            <input type="text" placeholder="Destination: Vashi Station" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" />
            <button 
              onClick={() => setShowRoute(true)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              SHOW TRAFFIC MAP
            </button>
          </div>
        </div>

        {/* --- GTA ROTATING MINI-MAP --- */}
        <div className="flex flex-col items-center">
          <div className="w-56 h-56 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-gray-200">
            <MapContainer 
              center={userPos} 
              zoom={17} 
              zoomControl={false} 
              dragging={false} 
              doubleClickZoom={false}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              {/* Using a very clean "Positron" tile set (Light & Clear) */}
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <LiveNavigation position={userPos} heading={heading} />
              {/* User Icon */}
              <CircleMarker center={userPos} radius={7} pathOptions={{ color: '#2563eb', fillColor: 'white', fillOpacity: 1, weight: 3 }} />
            </MapContainer>
            {/* North Indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-[8px] text-white px-2 py-0.5 rounded-full font-bold">NORTH</div>
          </div>
          <p className="mt-3 text-gray-400 font-black text-[9px] tracking-[0.3em]">LIVE GPS NAVIGATION</p>
        </div>
      </div>

      {/* --- BIG CLEAR MAIN MAP (STRICT BOUNDS) --- */}
      <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden h-[500px] relative">
        <MapContainer 
          center={[19.05, 72.95]} 
          zoom={12} 
          maxBounds={mumbaiBounds} // LOCK TO MUMBAI
          maxBoundsViscosity={1.0} // Prevents "bouncing" back
          minZoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Voyager tiles are very clear and professional */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {showRoute && trafficPath.map((segment, i) => (
            <Polyline 
              key={i} 
              positions={segment.coords} 
              pathOptions={{ color: segment.color, weight: 8, lineCap: 'round', opacity: 0.9 }} 
            />
          ))}

          {/* Start and End Dots */}
          <CircleMarker center={[19.0400, 72.8850]} radius={5} pathOptions={{ color: 'black' }} />
          <CircleMarker center={[19.0350, 73.0300]} radius={5} pathOptions={{ color: 'red' }} />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-gray-100 shadow-lg z-[1000]">
          <h4 className="text-[10px] font-black text-gray-400 mb-2 uppercase">Traffic Index</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#22c55e] rounded-full"></div><span className="text-[10px] font-bold">Clear</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#eab308] rounded-full"></div><span className="text-[10px] font-bold">Moderate</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ef4444] rounded-full"></div><span className="text-[10px] font-bold">Heavy</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficRoute;