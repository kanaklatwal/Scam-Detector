import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [retry, setRetry] = useState(0);
  const [dark, setDark] = useState(true);

  // 🌙 Theme toggle
  const toggleTheme = () => setDark(!dark);

  // 🔥 Save history
  const saveHistory = useCallback((data) => {
    if (data.prediction === "Analyzing") return;

    const updated = [{ ...data, url }, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  }, [history, url]);

  // 🔍 API call
  const checkWebsite = useCallback(async () => {
    if (!url.trim()) return alert("Enter URL");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", { url });

      setResult(res.data);
      saveHistory(res.data);

    } catch {
      alert("Backend not connected");
    }

    setLoading(false);
  }, [url, saveHistory]);

  // 🔄 Auto retry
  useEffect(() => {
    if (result?.prediction === "Analyzing" && retry < 3) {
      const t = setTimeout(() => {
        setRetry((p) => p + 1);
        checkWebsite();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [result, retry, checkWebsite]);

  // 🧠 Load history
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("history")) || [];
    setHistory(stored);
  }, []);

  const isScam = result?.prediction === "Scam";
  const isSuspicious = result?.prediction === "Suspicious";

  return (
    <div className={`${dark ? "bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white" : "bg-gray-100 text-black"} min-h-screen transition-all`}>

      {/* NAV */}
      <div className="flex justify-between p-6">
        <h1 className="font-bold text-xl">🚨 Scam Detector</h1>
        <button onClick={toggleTheme}>
          {dark ? "🌙" : "☀️"}
        </button>
      </div>

      {/* HERO */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-5xl font-bold mb-4">
          AI Powered Scam Detection
        </h1>

        <p className="mb-6 opacity-80">
          Detect phishing websites instantly using AI + VirusTotal
        </p>

        <div className="flex justify-center gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL..."
            className="p-4 rounded-xl w-80 bg-white/20"
          />

          <button
            onClick={checkWebsite}
            className="bg-pink-500 px-6 rounded-xl"
          >
            {loading ? "..." : "Check"}
          </button>
        </div>
      </div>

      {/* RESULT */}
      {loading && (
        <div className="flex justify-center mt-10">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {result && !loading && (
        <div className="text-center mt-10">
          <h2 className={`text-3xl font-bold ${
            isScam ? "text-red-400"
            : isSuspicious ? "text-yellow-400"
            : "text-green-400"
          }`}>
            {isScam
              ? "⚠️ Scam Detected"
              : isSuspicious
              ? "⚠️ Suspicious Website"
              : "✅ Safe Website"}
          </h2>

          <p className="mt-2">
            Risk Score: {result.riskScore}%
          </p>

          {/* Progress */}
          <div className="w-64 mx-auto mt-3 bg-white/20 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                isScam ? "bg-red-500"
                : isSuspicious ? "bg-yellow-400"
                : "bg-green-500"
              }`}
              style={{ width: `${result.riskScore}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* FEATURES */}
      <div className="mt-20 grid md:grid-cols-3 gap-6 px-10">
        <div className="bg-white/10 p-6 rounded-xl">⚡ Fast Detection</div>
        <div className="bg-white/10 p-6 rounded-xl">🤖 AI Powered</div>
        <div className="bg-white/10 p-6 rounded-xl">🌐 Real-time Analysis</div>
      </div>

      {/* HISTORY */}
      <div className="mt-16 px-10">
        <h3 className="mb-4">Recent Checks</h3>

        {history.map((item, i) => (
          <div key={i} className="bg-white/10 p-3 rounded mb-2 flex justify-between">
            <span>{item.url}</span>
            <span>{item.prediction}</span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="text-center mt-20 pb-10 text-sm opacity-70">
        Built with ❤️ using ML + React + Flask
      </div>
    </div>
  );
}

export default App;