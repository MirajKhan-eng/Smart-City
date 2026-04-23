const isLocal = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" || 
                window.location.hostname.startsWith("192.168.");

const API_BASE_URL = isLocal 
    ? "http://localhost:5000" 
    : "https://smart-city-1-42tj.onrender.com";

export default API_BASE_URL;
