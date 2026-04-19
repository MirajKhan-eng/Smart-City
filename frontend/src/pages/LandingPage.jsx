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
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in duration-700">
       <div className="mb-6 inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
        Mumbai & Navi Mumbai Smart City
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-8 leading-tight">
        Building a Better <br />
        <span className="text-blue-600">Digital Urban Future.</span>
      </h1>
      
      <p className="text-gray-500 max-w-lg mb-12 font-medium">
        Select your role to access personalized services, report issues, and stay updated with your city's real-time intelligence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Citizen Portal Card */}
        <button 
          onClick={() => navigate('/register?role=user')}
          className="group p-10 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-[2.5rem] shadow-xl transition-all hover:-translate-y-2 text-left relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="text-4xl mb-6 bg-blue-50 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">🏙️</div>
            <h3 className="text-3xl font-black text-gray-900 mb-3">Citizen Portal</h3>
            <p className="text-gray-500 font-medium">Report issues, check livability, and plan your commute.</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        {/* Official Portal Card */}
        <button 
          onClick={() => navigate('/register?role=admin')}
          className="group p-10 bg-gray-900 border-2 border-transparent hover:border-blue-500 rounded-[2.5rem] shadow-xl transition-all hover:-translate-y-2 text-left relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="text-4xl mb-6 bg-gray-800 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-3xl font-black text-white mb-3">Official Portal</h3>
            <p className="text-gray-400 font-medium">Authorized personnel login for city management.</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <p className="mt-16 text-gray-500 font-bold">
        Already have an account? <span onClick={() => navigate('/login')} className="text-blue-600 font-black cursor-pointer hover:underline">Login to Dashboard</span>
      </p>
    </div>
  );
};

export default LandingPage;