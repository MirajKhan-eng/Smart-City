import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/reports/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">City Command Center</h1>
          <p className="text-gray-500 font-medium">Monitoring all active civic issues</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
          Total Reports: {reports.length}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Loading City Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-50 text-blue-700 text-xs font-black px-2 py-1 rounded uppercase tracking-wider">
                  {report.category}
                </span>
                <span className="text-gray-400 text-xs font-mono">
                  #{report.id.toString().slice(-4)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{report.description}</p>
              
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {report.reporter_name?.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-gray-500">{report.reporter_name}</span>
                </div>
                <span className="text-xs text-gray-400 italic">📍 {report.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {reports.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold text-xl">The city is currently clear. No issues reported!</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;