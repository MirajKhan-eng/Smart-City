import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // 1. Save Token and User Object to LocalStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert(`Welcome back, ${res.data.user.name}!`);

      // 2. ROLE-BASED REDIRECT
      // We navigate first, then reload to refresh the Navbar state
      if (res.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-home');
      }
      
      // 3. Force a refresh so App.jsx catches the new localStorage data for the profile circle
      window.location.reload();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Login</h2>
        <p className="text-gray-500 mt-2">Access the SmartCity Portal</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-xl text-sm text-center font-medium border border-red-100">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          Login to SmartCity
        </button>
      </form>
      
      <div className="mt-10 pt-6 border-t border-gray-50 text-center">
        <p className="text-gray-500 text-sm">
          Don't have an account? 
          <span 
            className="ml-1 text-blue-600 font-bold cursor-pointer hover:underline" 
            onClick={() => navigate('/')}
          >
            Go to Landing Page
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;