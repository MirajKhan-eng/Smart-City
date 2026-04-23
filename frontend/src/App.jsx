import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './pages/ProtectedRoute';
import LivabilityScore from './pages/LivabilityScore';
import TrafficRoute from './pages/Transportation';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Emergency from './pages/Emergency';
import SOSDispatch from './pages/SOSDispatch';
import ProfileSettings from './pages/ProfileSettings';

function App() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        
        // GLOBAL LOCATION HANDSHAKE
        if (parsed.role === 'citizen') {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                    localStorage.setItem('user_location', JSON.stringify(loc));
                    console.log("📍 City Node Synchronized:", loc);
                },
                (err) => console.warn("⚠️ Location Handshake Declined"),
                { enableHighAccuracy: true }
            );
        }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/'; 
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
        
        {/* SIDEBAR */}
        {user && user.role === 'citizen' && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen shadow-lg z-[100]">
            <div className="p-8 text-3xl font-black text-blue-600 border-b border-gray-100 flex items-center gap-3">
              🏙️ SmartCity
            </div>

            <nav className="flex-1 p-6 space-y-4">
              <SidebarLink to="/user-home" icon="🏠" label="Home" />
              <SidebarLink to="/report-issue" icon="📝" label="Civic Complaints" />
              <SidebarLink to="/traffic-routes" icon="🚦" label="Traffic Routes" />
              <SidebarLink to="/livability" icon="📊" label="Livability Score" />
              <SidebarLink to="/emergency" icon="🚨" label="Emergency" />
            </nav>

            <div className="p-6 border-t border-gray-100">
               <SidebarLink to="/settings" icon="⚙️" label="Settings & Identity" />
            </div>
          </aside>
        )}

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col">
          <header className="h-20 bg-white border-b border-gray-200 flex justify-between items-center px-10 sticky top-0 z-50">
            {!user ? (
               <Link to="/" className="text-3xl font-black text-blue-700 tracking-tighter">SmartCity</Link>
            ) : <div />}
            
            <div className="flex items-center space-x-6">
              {!user ? (
                <Link to="/login" className="text-gray-600 font-black uppercase text-xs tracking-widest hover:text-blue-600 transition-all">Login</Link>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-4 p-2 pr-5 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-black text-gray-700 uppercase tracking-tight">{user.name}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-[2rem] shadow-2xl py-3 z-50 overflow-hidden">
                      <div className="px-6 py-3 border-b border-gray-50">
                        <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest">Role: {user.role}</p>
                      </div>
                      <Link to="/profile" className="block px-6 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all">Identity Hub</Link>
                      <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all border-t border-gray-50">Logout</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="p-10 bg-[#f8fafc] min-h-[calc(100vh-80px)]">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/user-home" element={<ProtectedRoute roleRequired="citizen"><UserDashboard /></ProtectedRoute>} />
              <Route path="/report-issue" element={<ProtectedRoute roleRequired="citizen"><ReportIssue /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/sos-dispatch" element={<ProtectedRoute roleRequired="admin"><SOSDispatch /></ProtectedRoute>} />
              
              <Route path="/profile" element={<ProtectedRoute roleRequired="citizen"><ProfileSettings /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute roleRequired="citizen"><ProfileSettings /></ProtectedRoute>} />

              <Route path="/traffic-routes" element={
                <ProtectedRoute roleRequired="citizen">
                  <TrafficRoute />
                </ProtectedRoute>
              } />

              <Route path="/livability" element={
                <ProtectedRoute roleRequired="citizen">
                  <LivabilityScore />
                </ProtectedRoute>
              } />

              <Route path="/emergency" element={
                <ProtectedRoute roleRequired="citizen">
                  <Emergency />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-sm ${
      isActive 
      ? 'bg-blue-600 text-white shadow-blue-200' 
      : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700 bg-white/50 border border-transparent hover:border-blue-100'
    }`}>
      <span className="text-xl">{icon}</span> {label}
    </Link>
  );
};

export default App;