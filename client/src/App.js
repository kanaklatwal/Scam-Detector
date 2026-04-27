import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(true);

  const toggleTheme = () => setDark(!dark);

  const saveHistory = useCallback((data) => {
    if (data.prediction === "Analyzing") return;

    const updated = [{ ...data, url }, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  }, [history, url]);

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

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("history")) || [];
    setHistory(stored);
  }, []);

  // 🔥 DELETE SINGLE ITEM
  const deleteItem = (index) => {
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  };

  // 🔥 CLEAR ALL
  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem("history");
  };

  const isScam = result?.prediction === "Scam";
  const isSuspicious = result?.prediction === "Suspicious";

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen transition-all`}>

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-white/10">
        <h1 className="text-xl font-semibold tracking-wide">
          🚨 ScamShield AI
        </h1>

        <button
          onClick={toggleTheme}
          className="bg-white/10 px-4 py-2 rounded-full hover:scale-105 transition"
        >
          {dark ? "🌙" : "☀️"}
        </button>
      </div>

      {/* HERO */}
      <div className="text-center mt-20 px-4">
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          Detect Scams <span className="text-blue-400">Instantly</span>
        </h1>

        <p className="text-gray-400 mb-10">
          AI-powered phishing detection with real-time analysis
        </p>

        <div className="flex justify-center">
          <div className="flex bg-white/10 backdrop-blur-lg rounded-2xl p-2 shadow-xl w-[500px] max-w-full">

            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="🔍 Paste suspicious URL..."
              className="flex-1 bg-transparent outline-none px-4 py-3"
            />

            <button
              onClick={checkWebsite}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-medium transition hover:scale-105"
            >
              {loading ? "..." : "Scan"}
            </button>
          </div>
        </div>
      </div>

      {/* RESULT */}
      {loading && (
        <div className="flex justify-center mt-10">
          <div className="w-10 h-10 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}

      {result && !loading && (
        <div className="text-center mt-12">
          <div className="inline-block px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-lg shadow-lg">

            <h2 className={`text-2xl font-semibold ${
              isScam ? "text-red-400"
              : isSuspicious ? "text-yellow-400"
              : "text-green-400"
            }`}>
              {isScam
                ? "❌ Scam Detected"
                : isSuspicious
                ? "⚠️ Suspicious"
                : "✅ Safe Website"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Risk Score: {result.riskScore}%
            </p>

            <div className="w-64 mx-auto mt-3 bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  isScam ? "bg-red-500"
                  : isSuspicious ? "bg-yellow-400"
                  : "bg-green-500"
                }`}
                style={{ width: `${result.riskScore}%` }}
              ></div>
            </div>

          </div>
        </div>
      )}

      {/* FEATURES */}
      <div className="mt-24 grid md:grid-cols-3 gap-6 px-10">
        {[
          { icon: "⚡", text: "Fast Detection" },
          { icon: "🤖", text: "AI Powered" },
          { icon: "🌐", text: "Real-time Analysis" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white/5 p-6 rounded-2xl text-center hover:scale-105 hover:shadow-xl transition cursor-pointer"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      {/* HISTORY */}
      <div className="mt-20 px-10 max-w-3xl mx-auto">

        {/* HEADER WITH CLEAR */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Recent Scans</h3>

          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-400 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {history.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-white/5 p-4 rounded-xl mb-3 hover:bg-white/10 transition"
          >
            <span className="truncate w-[60%]">{item.url}</span>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm ${
                item.prediction === "Scam"
                  ? "bg-red-500/20 text-red-400"
                  : item.prediction === "Suspicious"
                  ? "bg-yellow-400/20 text-yellow-300"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {item.prediction}
              </span>

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteItem(i)}
                className="text-red-400 hover:scale-110 transition"
              >
                ❌
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* FOOTER */}
      <div className="text-center mt-24 pb-10 text-sm text-gray-500">
        Built with ❤️ using AI + ML + React
      </div>
    </div>
  );
}

export default App;