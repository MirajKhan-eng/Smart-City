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

function App() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
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
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen shadow-sm">
            <div className="p-6 text-2xl font-black text-blue-600 border-b border-gray-100 flex items-center gap-2">
              🏙️ SmartCity
            </div>

            <nav className="flex-1 p-4 space-y-1">
              <SidebarLink to="/user-home" icon="🏠" label="Home" />
              <SidebarLink to="/report-issue" icon="📝" label="Civic Complaints" />
              <SidebarLink to="#" icon="🛡️" label="Safety" />
              <SidebarLink to="/traffic-routes" icon="🚦" label="Traffic Routes" />
              <SidebarLink to="/livability" icon="📊" label="Livability Score" />
              <SidebarLink to="#" icon="🚨" label="Emergency" />
            </nav>

            <div className="p-4 border-t border-gray-100">
               <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-600 font-bold text-sm transition-all rounded-xl hover:bg-red-50">
                Logout
              </button>
            </div>
          </aside>
        )}

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 sticky top-0 z-50">
            {!user ? (
               <Link to="/" className="text-2xl font-black text-blue-700">SmartCity</Link>
            ) : <div className="font-bold text-gray-400">Dashboard / <span className="text-gray-900">Overview</span></div>}
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <Link to="/login" className="text-gray-600 font-bold">Login</Link>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user.name}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-[10px] text-blue-600 uppercase font-black">Role: {user.role}</p>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="p-8">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/user-home" element={<ProtectedRoute roleRequired="citizen"><UserDashboard /></ProtectedRoute>} />
              <Route path="/report-issue" element={<ProtectedRoute roleRequired="citizen"><ReportIssue /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
              
              <Route path="/traffic-routes" element={
                <ProtectedRoute roleRequired="citizen">
                  <TrafficRoute />
                </ProtectedRoute>
              } />

              {/* NEW: Livability Score Route Added Here */}
              <Route path="/livability" element={
                <ProtectedRoute roleRequired="citizen">
                  <LivabilityScore />
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
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
    }`}>
      <span className="text-lg">{icon}</span> {label}
    </Link>
  );
};

export default App;