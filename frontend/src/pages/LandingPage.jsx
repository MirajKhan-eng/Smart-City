import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser && location.pathname === '/') {
      const user = JSON.parse(savedUser);
      console.log("LandingPage: Redirecting logged-in user...");
      
      // Inside LandingPage.jsx useEffect
         if (user.role === 'admin') {
         navigate('/admin-dashboard', { replace: true });
         } else if (user.role === 'citizen') { // Match the DB name!
          navigate('/report-issue', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
       <div className="mb-4 inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
        Mumbai & Navi Mumbai Official Portal
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-6 leading-tight">
        Building a Better <br />
        <span className="text-blue-600">Digital City.</span>
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-10">
        <button 
          onClick={() => navigate('/register?role=user')}
          className="group p-10 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-[2rem] shadow-xl transition-all hover:-translate-y-2 text-left"
        >
          <div className="text-4xl mb-4 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-2xl">🏙️</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Citizen Portal</h3>
          <p className="text-gray-500 text-sm">Report local issues easily.</p>
        </button>

        <button 
          onClick={() => navigate('/register?role=admin')}
          className="group p-10 bg-gray-900 border-2 border-transparent hover:border-blue-500 rounded-[2rem] shadow-xl transition-all hover:-translate-y-2 text-left"
        >
          <div className="text-4xl mb-4 bg-gray-800 w-16 h-16 flex items-center justify-center rounded-2xl">🛡️</div>
          <h3 className="text-2xl font-bold text-white mb-2">Official Portal</h3>
          <p className="text-gray-400 text-sm">Authorized personnel only.</p>
        </button>
      </div>

      <p className="mt-12 text-gray-500 font-medium">
        Already have an account? <span onClick={() => navigate('/login')} className="text-blue-600 font-bold cursor-pointer hover:underline">Login here</span>
      </p>
    </div>
  );
};

export default LandingPage;