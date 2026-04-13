import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, MapPin, Send } from 'lucide-react';

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pothole',
    location: ''
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert("Please login to report issues.");
        return navigate('/login');
      }

      const reportData = { ...formData, user_id: user.id };
      await axios.post('http://localhost:5000/api/reports/submit', reportData);

      setStatus({ type: 'success', msg: '✅ Issue reported successfully! Authorities have been notified.' });
      setFormData({ title: '', description: '', category: 'Pothole', location: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: '❌ ' + (err.response?.data?.message || "Submission failed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <AlertCircle size={32} /> Report Civic Issue
          </h2>
          <p className="mt-2 text-blue-100">Help make Mumbai & Navi Mumbai smarter by flagging local problems.</p>
        </div>

        <div className="p-8">
          {status.msg && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-medium animate-in fade-in zoom-in duration-300 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                Issue Title
              </label>
              <input
                type="text"
                value={formData.title}
                placeholder="e.g. Major pothole near Vashi Bridge"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Category</label>
                <select
                  value={formData.category}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
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
                <label className="text-sm font-bold text-slate-700 mb-2 block">Location / Ward</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.location}
                    placeholder="e.g. Belapur Sector 15"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Description</label>
              <textarea
                rows="4"
                value={formData.description}
                placeholder="Provide more details to help officials locate the problem..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? "Submitting..." : (
                <>Submit Report <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;