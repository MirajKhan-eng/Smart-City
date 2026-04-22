import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ThumbsUp,
  MapPin,
  Camera,
  Plus,
  X,
  MessageSquare,
  Navigation,
  Filter,
  AlertCircle,
  Clock,
  ChevronDown,
  CheckCircle2,
  UserCheck,
  HardHat,
  ShieldCheck,
  Pencil,
  Maximize2,
  Activity,
} from "lucide-react";

const ReportIssue = () => {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [votedIds, setVotedIds] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Pothole",
    location: "",
    image_url: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const categories = [
    "Pothole",
    "Streetlight",
    "Waste Management",
    "Water Leakage",
    "Security/Crime",
    "Traffic Issue",
    "Other",
  ];

  useEffect(() => {
    fetchReports();
    if (user) fetchMyVotes();
  }, []);

  const fetchMyVotes = async () => {
    try {
      const res = await axios.get(
        `https://smart-city-1-42tj.onrender.com/api/reports/my-votes/${user.id}`,
      );
      setVotedIds(new Set(res.data));
    } catch (err) {
      console.error("Votes Sync Failed");
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(
        `https://smart-city-1-42tj.onrender.com/api/reports/all`,
      );
      setReports(res.data);
    } catch (err) {
      console.error("Fetch Failed");
    }
  };

  const handleLike = async (id) => {
    if (!user) return alert("Please Login to vote");
    const isVoted = votedIds.has(id);
    const newVotedIds = new Set(votedIds);
    if (isVoted) {
      newVotedIds.delete(id);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, votes: Math.max(0, (r.votes || 1) - 1) } : r,
        ),
      );
    } else {
      newVotedIds.add(id);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, votes: (r.votes || 0) + 1 } : r,
        ),
      );
    }
    setVotedIds(newVotedIds);
    try {
      await axios.post(
        `https://smart-city-1-42tj.onrender.com/api/reports/${id}/vote`,
        { user_id: user.id },
      );
      setTimeout(fetchReports, 500);
    } catch (err) {
      fetchReports();
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: { "User-Agent": "SmartCityApp/1.0" },
              },
            );
            const addr = res.data.address;
            const cleanAddress = [
              addr.road,
              addr.suburb || addr.neighbourhood,
              addr.city || addr.town,
              addr.postcode,
            ]
              .filter(Boolean)
              .join(", ");
            setFormData({
              ...formData,
              location: cleanAddress || res.data.display_name,
            });
          } catch (err) {
            setFormData({
              ...formData,
              location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            });
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
          alert("Location access denied.");
        },
      );
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({
          ...formData,
          image_url: canvas.toDataURL("image/jpeg", 0.6),
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleLocationChange = async (val) => {
    setFormData({ ...formData, location: val });
    if (val.length > 3) {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5&countrycodes=in&viewbox=72.7126,18.8441,73.1833,19.3300&bounded=1`,
          {
            headers: { "User-Agent": "SmartCityApp/1.0" },
          },
        );
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Search Failed");
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s) => {
    setFormData({ ...formData, location: s.display_name });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, user_id: parseInt(user.id) };
      if (editingReportId) {
        await axios.put(
          `https://smart-city-1-42tj.onrender.com/api/reports/${editingReportId}`,
          payload,
        );
      } else {
        await axios.post(
          "https://smart-city-1-42tj.onrender.com/api/reports/submit",
          payload,
        );
      }
      setShowForm(false);
      setEditingReportId(null);
      setFormData({
        title: "",
        description: "",
        category: "Pothole",
        location: "",
        image_url: "",
      });
      fetchReports();
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReportId(report.id);
    setFormData({
      title: report.title,
      description: report.description,
      category: report.type || "Pothole",
      location: report.location,
      image_url: report.image_url || "",
    });
    setShowForm(true);
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase().replace("-", " ");
    switch (s) {
      case "resolved":
        return "bg-green-100 text-green-600 border-green-200";
      case "in progress":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case "pending":
        return "bg-red-50 text-red-500 border-red-100";
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-[#FBFBFE] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Community Feed
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Priority Sorted by Citizen Votes
          </p>
        </div>
        <button
          onClick={() => {
            setEditingReportId(null);
            setFormData({
              title: "",
              description: "",
              category: "Pothole",
              location: "",
              image_url: "",
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white p-5 rounded-[2rem] shadow-xl shadow-blue-200 hover:scale-110 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-8 pb-20">
        {reports.length === 0 ? (
          <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">
            Synchronizing secure data...
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group animate-in slide-in-from-bottom-5"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">
                    {report.reporter_name?.[0].toUpperCase() || "U"}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 leading-none">
                      {report.reporter_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1.5 tracking-tighter">
                      ID: #{report.id} •{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user && user.id === report.user_id && (
                    <button
                      onClick={() => handleEdit(report)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit Report"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <div
                    className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${getStatusStyle(report.status)}`}
                  >
                    {report.status || "Pending"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="inline-block bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-lg uppercase border border-blue-100 mb-1">
                  {report.type}
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {report.description}
                </p>
              </div>

              {report.image_url && (
                <div
                  className="relative group/img rounded-[2rem] overflow-hidden mb-6 border border-slate-50 shadow-inner cursor-pointer"
                  onClick={() => setSelectedImage(report.image_url)}
                >
                  <img
                    src={report.image_url}
                    className="w-full h-80 object-cover group-hover/img:scale-105 transition-transform duration-1000"
                    alt="Evidence"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/20 text-white">
                      <Maximize2 size={24} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-8 px-2">
                <MapPin size={16} className="text-blue-500" />
                <span className="truncate">{report.location}</span>
              </div>

              {/* PROGRESS TIMELINE SECTION */}
              <div className="mb-10 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock size={12} className="text-blue-500" /> Resolution
                  Timeline
                </h5>
                <div className="relative space-y-8">
                  <TimelineStep
                    active={report.tracking_step >= 1}
                    icon={<CheckCircle2 size={14} />}
                    title="Report Logged"
                    desc="Official entry created."
                    date={new Date(report.created_at).toLocaleDateString()}
                  />
                  <TimelineStep
                    active={report.tracking_step >= 2}
                    icon={<UserCheck size={14} />}
                    title="Department Assigned"
                    desc="Forwarded to Ward Officer."
                  />
                  <TimelineStep
                    active={report.tracking_step >= 3}
                    icon={<HardHat size={14} />}
                    title="Site Inspection"
                    desc="Field engineer investigating."
                  />
                  <TimelineStep
                    active={report.tracking_step >= 4}
                    icon={<Activity size={14} />}
                    title="Work in Progress"
                    desc="On-ground repairs active."
                  />
                  <TimelineStep
                    active={report.tracking_step >= 5}
                    icon={<ShieldCheck size={14} />}
                    title="Final Inspection"
                    desc="Quality audit & verification."
                  />
                  <TimelineStep
                    active={report.tracking_step >= 6}
                    icon={<CheckCircle2 size={14} />}
                    title="Issue Resolved"
                    desc="Verified and closed."
                    isLast={true}
                  />

                  <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-slate-200 -z-10"></div>
                  <div
                    className="absolute left-[11px] top-4 w-[2px] bg-blue-500 -z-10 transition-all duration-1000"
                    style={{
                      height: `${Math.min(100, ((report.tracking_step - 1) / 5) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button
                  onClick={() => handleLike(report.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group/btn shadow-sm ${votedIds.has(report.id) ? "bg-blue-600 text-white shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <ThumbsUp size={18} /> <span>{report.votes || 0}</span>
                </button>
                <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                  <MessageSquare size={18} /> Discuss
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-8 right-8 text-white p-4 hover:bg-white/10 rounded-full transition-all">
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10 zoom-in"
            alt="Evidence Full"
          />
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-black text-3xl uppercase italic tracking-tighter text-slate-900">
                  {editingReportId ? "Edit Report" : "New City Report"}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Authorized Submission
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Category
                </label>
                <select
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 border border-slate-100"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Title
                </label>
                <input
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold"
                  placeholder="Summary"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold"
                    value={formData.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600"
                  >
                    <Navigation size={24} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Description
                </label>
                <textarea
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-32 font-medium border border-slate-100"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  Evidence Upload
                </label>
                <label className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-slate-50 group">
                  <Camera
                    className="text-slate-200 mb-3 group-hover:text-blue-50"
                    size={48}
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {formData.image_url ? "CHANGE PHOTO ✓" : "UPLOAD PHOTO"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImage}
                  />
                </label>
              </div>
              <button
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                {loading
                  ? "PROCESSING..."
                  : editingReportId
                    ? "UPDATE OFFICIAL REPORT"
                    : "SUBMIT OFFICIAL REPORT"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineStep = ({ active, icon, title, desc, date }) => (
  <div className="flex items-start gap-6 relative group/step">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500 ${active ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200 scale-110" : "bg-white border-slate-200 text-slate-300"}`}
    >
      {active ? icon : <Clock size={12} />}
    </div>
    <div>
      <div className="flex items-center gap-3">
        <h6
          className={`text-[11px] font-black uppercase tracking-tight ${active ? "text-slate-900" : "text-slate-400"}`}
        >
          {title}
        </h6>
        {date && (
          <span className="text-[9px] font-bold text-slate-300">{date}</span>
        )}
      </div>
      <p
        className={`text-[10px] font-medium leading-none mt-1.5 ${active ? "text-slate-500" : "text-slate-300"}`}
      >
        {desc}
      </p>
    </div>
  </div>
);

export default ReportIssue;
