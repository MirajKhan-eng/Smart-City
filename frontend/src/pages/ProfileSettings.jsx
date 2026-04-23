import React, { useState } from "react";
import { User, Shield, Bell, Lock, Camera, Save, Globe, Eye, EyeOff } from "lucide-react";

const ProfileSettings = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest User", email: "guest@smartcity.gov", role: "citizen" };
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
          setIsSaving(false);
          alert("✓ Profile Identity Node Updated Successfully");
      }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-4">
          <Shield className="text-blue-600 w-12 h-12" /> Identity Hub
        </h1>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3">
          Secure Citizen Profile & Security Management
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 border border-blue-50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <div className="relative mb-8 flex justify-center">
              <div className="w-40 h-40 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-lg relative overflow-hidden">
                <span className="text-6xl font-black text-blue-600">{user.name?.charAt(0).toUpperCase()}</span>
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                  <Camera className="text-white" size={32} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{user.name}</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6">Verified Citizen Account</p>
              
              <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Status</span>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">Active</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trust Score</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">98 / 100</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-10">
          {/* General Information */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 border border-blue-50">
            <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight flex items-center gap-3 mb-8">
              <User className="text-blue-500" /> Personal Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Full Legal Name</label>
                <input 
                    type="text" 
                    defaultValue={user.name} 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Official Email Address</label>
                <input 
                    type="email" 
                    defaultValue={user.email} 
                    disabled
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Contact Number</label>
                <input 
                    type="tel" 
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Communication Language</label>
                <select className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                  <option>English (IN)</option>
                  <option>Hindi (HI)</option>
                  <option>Marathi (MH)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 border border-blue-50">
            <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight flex items-center gap-3 mb-8">
              <Lock className="text-amber-500" /> Security Node
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Account Password</label>
                <div className="relative">
                  <input 
                      type={showPassword ? "text" : "password"} 
                      defaultValue="********" 
                      className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Bell size={20} /></div>
                      <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Two-Factor Authentication</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add an extra layer of security</p>
                      </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm"></div>
                  </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                {isSaving ? (
                    <>PROCESSING SECURE UPLOAD...</>
                ) : (
                    <><Save size={20} /> Save Tactical Profile</>
                )}
              </button>
              
              <button 
                onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                className="px-10 py-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95"
              >
                Logout
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
