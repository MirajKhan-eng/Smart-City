import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Detect role from URL (e.g., /register?role=admin)
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get("role") || "user";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: initialRole,
    adminId: "", // Field for official ID
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 2. Dynamic Departmental ID Validation
    if (formData.role === "admin") {
      const formatRegex = /^MUM-\d{4}-[A-Z]+$/;
      if (!formatRegex.test(formData.adminId)) {
        setError("❌ Invalid Department ID Format (MUM-YYYY-DEPT).");
        return;
      }
    }

    try {
      // Map adminId to deptId for backend consistency
      const payload = {
        ...formData,
        deptId: formData.role === "admin" ? formData.adminId : null,
      };
      await axios.post(
        "http://https://smart-city-1-42tj.onrender.com/api/auth/register",
        payload,
      );
      alert(
        `Registration Successful as ${formData.role}! Redirecting to login...`,
      );
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div
      className={`max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border-t-8 ${formData.role === "admin" ? "border-red-600" : "border-blue-600"}`}
    >
      <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
        {formData.role === "admin"
          ? "Official Registration"
          : "Citizen Sign Up"}
      </h2>
      <p className="text-center text-gray-500 mb-6 italic">
        {formData.role === "admin"
          ? "Authorized City Personnel Only"
          : "Join the Smart City Network"}
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-lg text-sm border border-red-200 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Miraj Khan"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@mumbai.gov"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        {/* 3. Conditional Admin ID Field */}
        {formData.role === "admin" && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <label className="block text-xs font-bold text-red-700 mb-1 uppercase tracking-wider">
              Departmental Admin ID
            </label>
            <input
              type="text"
              placeholder="e.g. MUM-2026-GOV"
              className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, adminId: e.target.value })
              }
              required
            />
            <p className="text-[10px] text-red-500 mt-2 font-medium">
              This ID is required for administrative status.
            </p>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 text-white ${formData.role === "admin" ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"}`}
        >
          {formData.role === "admin"
            ? "Authorize & Register"
            : "Register as Citizen"}
        </button>
      </form>
    </div>
  );
};

export default Register;
