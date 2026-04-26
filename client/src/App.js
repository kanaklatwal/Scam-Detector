import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkWebsite = async () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setLoading(true);
    setResult(null);
    setRetryCount(0);

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

  // 🔄 Auto retry for VirusTotal
  useEffect(() => {
    if (result?.prediction === "Analyzing" && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        checkWebsite();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [result, retryCount]);

  // 🔥 STATES
  const isScam = result?.prediction === "Scam";
  const isAnalyzing = result?.prediction === "Analyzing";
  const isSuspicious = result?.prediction === "Suspicious";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-pink-900 px-4">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md text-white">

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
            className="flex-1 p-3 rounded-xl bg-white/20 text-white placeholder-gray-300"
          />

          <button
            onClick={checkWebsite}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-red-500 px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "..." : "Check"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Analyzing */}
        {isAnalyzing && !loading && (
          <h2 className="text-yellow-400 text-xl text-center mt-4">
            ⏳ Analyzing URL...
          </h2>
        )}

        {/* Result */}
        {result && !loading && !isAnalyzing && (
          <div className="mt-6 text-center">

            {/* Status */}
            <h2
              className={`text-2xl font-bold mb-3 ${
                isScam
                  ? "text-red-400"
                  : isSuspicious
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {isScam
                ? "⚠️ Scam Detected"
                : isSuspicious
                ? "⚠️ Suspicious Website"
                : "✅ Safe Website"}
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-300 mb-3">
              {isScam
                ? "Avoid entering personal data."
                : isSuspicious
                ? "This site looks suspicious. Be careful."
                : "This website appears safe."}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  isScam
                    ? "bg-red-500"
                    : isSuspicious
                    ? "bg-yellow-400"
                    : "bg-green-500"
                }`}
                style={{ width: `${result.riskScore}%` }}
              ></div>
            </div>

            {/* Score */}
            <p className="mt-3 text-sm">
              Risk Score: {result.riskScore}%
            </p>

            {/* 🔥 SOURCE (real-world touch) */}
            <p className="text-xs text-gray-400 mt-2">
              Source: {result.source}
            </p>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;