import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Shield, User, Lock, Building, Info } from "lucide-react";

const Login = () => {
  const [isOfficial, setIsOfficial] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    deptId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formData,
        portalType: isOfficial ? "official" : "citizen",
      };
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        payload,
      );
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        // Departmental Routing
        if (res.data.user.dept_id?.includes("SOS")) {
          navigate("/sos-dispatch");
        } else {
          navigate("/admin-dashboard");
        }
      } else {
        navigate("/user-home");
      }

      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please verify credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* TABS */}
        <div className="flex bg-white p-2 rounded-[2rem] shadow-sm mb-10 border border-slate-100">
          <button
            onClick={() => {
              setIsOfficial(false);
              setError("");
            }}
            className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isOfficial ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
          >
            <User size={16} /> Citizen Login
          </button>
          <button
            onClick={() => {
              setIsOfficial(true);
              setError("");
            }}
            className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isOfficial ? "bg-blue-600 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Shield size={16} /> Official Portal
          </button>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          <div className="text-center mb-12">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${isOfficial ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-900"}`}
            >
              {isOfficial ? <Building size={40} /> : <User size={40} />}
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">
              {isOfficial ? "Department Access" : "Citizen Portal"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              {isOfficial
                ? "Secured SmartCity Node"
                : "Personal Dashboard Login"}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-5 mb-10 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-3 animate-in shake duration-300">
              <Info size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">
                Email Identity
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={
                    isOfficial ? "officer@mumbai.gov.in" : "citizen@example.com"
                  }
                  className="w-full bg-slate-50 p-5 rounded-2xl outline-none border border-slate-100 font-bold focus:border-blue-500 transition-all text-slate-900"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">
                Secured Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 p-5 rounded-2xl outline-none border border-slate-100 font-bold focus:border-blue-500 transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-10 ${isOfficial ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {loading ? "Verifying Identity..." : "Authorize Access"}
            </button>
          </form>

          {isOfficial && (
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
              <Info size={14} className="text-blue-500" />
              <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                Unauthorized access to official nodes is strictly monitored and
                logged.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
