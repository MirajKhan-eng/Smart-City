import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser && location.pathname === '/') {
      const user = JSON.parse(savedUser);
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'citizen') {
        navigate('/user-home', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden rounded-[3rem] shadow-2xl">
      {/* BACKGROUND IMAGE WITH OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero-bg.png" 
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
          alt="Futuristic City"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-white/90 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
         <div className="mb-6 inline-block bg-blue-600/10 backdrop-blur-md text-blue-700 px-6 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase border border-blue-600/20">
          Mumbai & Navi Mumbai Smart City
        </div>
        <h1 className="text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tighter">
          Building a Better <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Digital Urban Future.</span>
        </h1>
        
        <p className="text-gray-700 max-w-xl mx-auto mb-16 font-semibold text-lg leading-relaxed">
          Select your portal to access personalized civic services, real-time traffic intelligence, and mission-critical emergency support.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
          {/* Citizen Portal Card */}
          <button 
            onClick={() => navigate('/register?role=user')}
            className="group p-12 bg-white/70 backdrop-blur-xl border border-white hover:border-blue-500/50 rounded-[3.5rem] shadow-2xl transition-all hover:-translate-y-3 text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="text-5xl mb-8 bg-blue-600 w-24 h-24 flex items-center justify-center rounded-[2rem] text-white shadow-lg group-hover:rotate-6 transition-all duration-500">🏙️</div>
              <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Citizen Portal</h3>
              <p className="text-gray-600 font-bold leading-snug">Report issues, track livability, and optimize your daily city commute.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
          </button>

          {/* Official Portal Card */}
          <button 
            onClick={() => navigate('/register?role=admin')}
            className="group p-12 bg-slate-900/95 backdrop-blur-xl border border-slate-800 hover:border-blue-500/50 rounded-[3.5rem] shadow-2xl transition-all hover:-translate-y-3 text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="text-5xl mb-8 bg-gradient-to-br from-indigo-500 to-blue-600 w-24 h-24 flex items-center justify-center rounded-[2rem] text-white shadow-lg group-hover:rotate-[-6deg] transition-all duration-500">🛡️</div>
              <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Official Portal</h3>
              <p className="text-slate-400 font-bold leading-snug">Authorized access for city officials to manage reports and tactical emergency dispatch.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
          </button>
        </div>

        <p className="mt-20 text-gray-900 font-black tracking-wide uppercase text-xs">
          Already a resident? <span onClick={() => navigate('/login')} className="text-blue-600 cursor-pointer hover:underline underline-offset-8 transition-all">Secure Login to Dashboard</span>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;