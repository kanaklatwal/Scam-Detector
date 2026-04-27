import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history")) || [];
    setHistory(saved);
  }, []);

  const saveHistory = (data) => {
    const updated = [{ url, ...data }, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  };

  // 🔥 IMPORTANT (OLD STYLE MAPPING)
  const mapPrediction = (p) => {
    if (!p) return "Error";

    const t = p.toLowerCase();

    if (t === "safe") return "Genuine";
    if (t === "scam") return "Scam";
    if (t === "suspicious") return "Suspicious";

    return p;
  };

  const getColor = (type) => {
    const t = type.toLowerCase();
    return t === "scam"
      ? "text-red-500"
      : t === "suspicious"
      ? "text-yellow-400"
      : t === "error"
      ? "text-gray-400"
      : "text-green-500";
  };

  const getIcon = (type) => {
    const t = type.toLowerCase();
    return t === "scam"
      ? "❌"
      : t === "suspicious"
      ? "⚠️"
      : t === "error"
      ? "🚫"
      : "✅";
  };

  const checkWebsite = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "https://scam-detector-2-rkdu.onrender.com/predict",
        { url }
      );

      const formatted = {
        prediction: mapPrediction(res.data.prediction),
        riskScore: res.data.riskScore || 0,
        reasons: res.data.reasons || [],
      };

      setResult(formatted);
      saveHistory(formatted);
    } catch {
      setResult({
        prediction: "Error",
        riskScore: 0,
        reasons: ["Backend not connected"],
      });
    }

    setLoading(false);
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen">

      {/* HEADER */}
      <div className="text-center pt-16">
        <h1 className="text-5xl font-bold">
          Detect Scams <span className="text-blue-500">Instantly</span>
        </h1>

        <p className="text-gray-400 mt-3">
          ScamShield AI helps you identify fraudulent websites and suspicious emails using ML.
        </p>
      </div>

      {/* INPUT */}
      <div className="flex justify-center mt-10">
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 w-[320px]"
            placeholder="Enter URL"
          />

          <button
            onClick={checkWebsite}
            className="bg-blue-500 px-4 rounded"
          >
            Scan
          </button>
        </div>
      </div>

      {/* RESULT */}
      {loading && <div className="text-center mt-6">⏳ Checking...</div>}

      {result && !loading && (
        <div className="flex justify-center mt-10">
          <div className="bg-[#1e293b] p-6 rounded-xl w-[350px] text-center">

            <h2 className={`text-2xl ${getColor(result.prediction)}`}>
              {getIcon(result.prediction)} {result.prediction}
            </h2>

            <p className="mt-2">Risk Score: {result.riskScore}%</p>

            {result.reasons.length > 0 && (
              <ul className="mt-4 text-gray-300 text-sm">
                {result.reasons.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="mt-10 px-10">
          <h3 className="mb-3">URL History</h3>

          {history.map((item, i) => (
            <div key={i} className="flex justify-between bg-gray-800 p-2 mb-2 rounded">
              <span>{item.url}</span>
              <span className={getColor(item.prediction)}>
                {getIcon(item.prediction)} {item.prediction}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center text-gray-500 mt-10 pb-6 text-sm">
        Built with ❤️ using React + ML | ScamShield AI
      </div>
    </div>
  );
}

export default App;