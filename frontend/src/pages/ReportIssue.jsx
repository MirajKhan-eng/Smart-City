import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pothole', // Default category
    location: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the logged-in user's ID from localStorage (we saved this during login)
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert("Please login first!");
        return navigate('/login');
      }

      const reportData = { ...formData, user_id: user.id };
      
      const res = await axios.post('http://localhost:5000/api/reports/submit', reportData);
      setMessage("✅ Issue reported successfully! City officials will be notified.");
      
      // Clear form
      setFormData({ title: '', description: '', category: 'Pothole', location: '' });
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.message || "Could not submit report"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-blue-50">
      <h2 className="text-3xl font-bold mb-2 text-blue-900">Report a Civic Issue</h2>
      <p className="text-gray-500 mb-8">Help us make Mumbai & Navi Mumbai smarter by reporting local problems.</p>

      {message && (
        <div className={`p-4 mb-6 rounded-lg text-center font-medium ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Short Title</label>
          <input
            type="text"
            placeholder="e.g. Broken Streetlight near Vashi Station"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option>Pothole</option>
              <option>Waste / Garbage</option>
              <option>Water Leakage</option>
              <option>Electricity / Streetlight</option>
              <option>Traffic / Safety</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location / Ward</label>
            <input
              type="text"
              placeholder="e.g. Ward 4, Nerul"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
          <textarea
            rows="4"
            placeholder="Describe the issue in detail so officials can find it..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95"
        >
          Submit Report
        </button>
      </form>
    </div>
  );
};

export default ReportIssue;