import React, { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkWebsite = async () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", {
        url: url,
      });
      setResult(res.data);
    } catch (err) {
      alert("Backend not connected");
    }

    setLoading(false);
  };

  const isScam = result?.prediction === "Scam";
  const isAnalyzing = result?.prediction === "Analyzing";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-pink-900 px-4">

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md text-white transition-all duration-500">

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2">
          🚨 Scam Detector
        </h1>
        <p className="text-center text-gray-300 text-sm mb-6">
          Check if a website is safe or phishing
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-white/20 placeholder-gray-300 text-white 
            focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />

          <button
            onClick={checkWebsite}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-red-500 
            hover:scale-105 hover:shadow-lg transition-all duration-300 
            px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "..." : "Check"}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center mt-6">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

         {isAnalyzing && (
            <h2 className="text-yellow-400 text-xl font-bold mt-4">
                ⏳ Analyzing URL...
            </h2>
         )}
        {/* Result */}
        {result && !loading && !isAnalyzing && (
          <div className="mt-6 text-center animate-fade-in">

            {/* Status */}
            <h2 className={`text-2xl font-bold mb-3 ${
              isScam 
                ? "text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.7)]" 
                : "text-green-400 drop-shadow-[0_0_10px_rgba(0,255,0,0.7)]"
            }`}>
              {isScam ? "⚠️ Scam Detected" : "✅ Safe Website"}
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-300 mb-3">
              {isScam 
                ? "This website looks suspicious. Avoid entering personal data."
                : "This website appears safe to use."}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3 mt-2 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  isScam 
                    ? "bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.7)]" 
                    : "bg-green-500 shadow-[0_0_10px_rgba(0,255,0,0.7)]"
                }`}
                style={{ width: `${result.riskScore}%` }}
              ></div>
            </div>

            {/* Score */}
            <p className="mt-3 text-gray-300 text-sm">
              Risk Score: <span className="font-semibold">{result.riskScore}%</span>
            </p>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;