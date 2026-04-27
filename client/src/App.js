import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("url");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [urlHistory, setUrlHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);

  // 🔁 normalize
  const normalize = (t) => t?.toLowerCase();

  // LOAD HISTORY
  useEffect(() => {
    setUrlHistory(JSON.parse(localStorage.getItem("urlHistory")) || []);
    setEmailHistory(JSON.parse(localStorage.getItem("emailHistory")) || []);
  }, []);

  // SAVE URL HISTORY
  const saveUrlHistory = (data) => {
    const updated = [
      {
        url,
        prediction: data.prediction,
        riskScore: data.riskScore,
      },
      ...urlHistory,
    ].slice(0, 5);

    setUrlHistory(updated);
    localStorage.setItem("urlHistory", JSON.stringify(updated));
  };

  // SAVE EMAIL HISTORY
  const saveEmailHistory = (data) => {
    const updated = [
      {
        url: subject || body.slice(0, 20),
        prediction: data.prediction,
        riskScore: data.riskScore,
      },
      ...emailHistory,
    ].slice(0, 5);

    setEmailHistory(updated);
    localStorage.setItem("emailHistory", JSON.stringify(updated));
  };

  // ❌ DELETE
  const deleteItem = (index) => {
    if (mode === "url") {
      const updated = urlHistory.filter((_, i) => i !== index);
      setUrlHistory(updated);
      localStorage.setItem("urlHistory", JSON.stringify(updated));
    } else {
      const updated = emailHistory.filter((_, i) => i !== index);
      setEmailHistory(updated);
      localStorage.setItem("emailHistory", JSON.stringify(updated));
    }
  };

  // ❌ CLEAR
  const clearAll = () => {
    if (mode === "url") {
      setUrlHistory([]);
      localStorage.removeItem("urlHistory");
    } else {
      setEmailHistory([]);
      localStorage.removeItem("emailHistory");
    }
  };

  // 🧠 SAFE RESULT MAPPING
  const mapResult = (data) => ({
    prediction: data?.prediction || "Error",
    riskScore: data?.riskScore ?? data?.risk_score ?? 0,
    reasons: Array.isArray(data?.reasons) ? data.reasons : [],
  });

  // 🔥 URL API
  const checkWebsite = async () => {
    if (!url.trim()) return alert("Enter URL");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "https://scam-detector-2-rkdu.onrender.com/predict",
        { url }
      );

      const fixed = mapResult(res.data);
      setResult(fixed);
      saveUrlHistory(fixed);
    } catch (err) {
      console.error(err);
      setResult({
        prediction: "Error",
        riskScore: 0,
        reasons: ["Backend not connected"],
      });
    }

    setLoading(false);
  };

  // 🔥 EMAIL API
  const checkEmail = async () => {
    if (!subject.trim() && !body.trim())
      return alert("Enter email content");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "https://scam-detector-2-rkdu.onrender.com/email",
        { subject, body }
      );

      const fixed = mapResult(res.data);
      setResult(fixed);
      saveEmailHistory(fixed);
    } catch (err) {
      console.error(err);
      setResult({
        prediction: "Error",
        riskScore: 0,
        reasons: ["Backend not connected"],
      });
    }

    setLoading(false);
  };

  // 🎨 UI helpers
  const getColor = (type) => {
    const t = normalize(type);
    if (t === "scam") return "text-red-500";
    if (t === "suspicious") return "text-yellow-500";
    if (t === "error") return "text-gray-400";
    return "text-green-500";
  };

  const getIcon = (type) => {
    const t = normalize(type);
    if (t === "scam") return "❌";
    if (t === "suspicious") return "⚠️";
    if (t === "error") return "🚫";
    return "✅";
  };

  const currentHistory = mode === "url" ? urlHistory : emailHistory;

  return (
    <div className="bg-[#0f172a] text-white min-h-screen">

      {/* HEADER */}
      <div className="text-center pt-16">
        <h1 className="text-4xl font-bold">
          Detect Scams <span className="text-blue-500">Instantly</span>
        </h1>
      </div>

      {/* MODE */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={() => setMode("url")}
          className={mode === "url" ? "bg-blue-500 px-4 py-2 rounded" : "bg-gray-700 px-4 py-2 rounded"}
        >
          URL Scanner
        </button>

        <button
          onClick={() => setMode("email")}
          className={mode === "email" ? "bg-blue-500 px-4 py-2 rounded" : "bg-gray-700 px-4 py-2 rounded"}
        >
          Email Scanner
        </button>
      </div>

      {/* INPUT */}
      <div className="flex justify-center mt-6">
        {mode === "url" ? (
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkWebsite()}
              className="px-4 py-2 rounded bg-gray-800 w-[300px]"
              placeholder="Enter URL"
            />
            <button onClick={checkWebsite} className="bg-blue-500 px-4 rounded">
              Scan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-2 rounded bg-gray-800"
              placeholder="Subject"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="px-4 py-2 rounded bg-gray-800"
              placeholder="Email content"
            />
            <button onClick={checkEmail} className="bg-blue-500 px-4 py-2 rounded">
              Check Email
            </button>
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && <div className="text-center mt-6">⏳ Checking...</div>}

      {/* RESULT */}
      {result && !loading && (
        <div className="text-center mt-10">
          <h2 className={`text-2xl ${getColor(result.prediction)}`}>
            {getIcon(result.prediction)} {result.prediction}
          </h2>

          <p>Risk Score: {result.riskScore}%</p>

          {result.reasons.length > 0 && (
            <ul className="mt-4 text-gray-300">
              {result.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* HISTORY */}
      {currentHistory.length > 0 && (
        <div className="mt-10 px-10">
          <div className="flex justify-between mb-3">
            <h3>{mode === "url" ? "URL History" : "Email History"}</h3>
            <button onClick={clearAll} className="text-red-500">
              Clear
            </button>
          </div>

          {currentHistory.map((item, i) => (
            <div key={i} className="flex justify-between bg-gray-800 p-2 mb-2 rounded">
              <span>{item.url}</span>
              <div className="flex gap-3 items-center">
                <span>{getIcon(item.prediction)}</span>
                <span className={getColor(item.prediction)}>
                  {item.prediction}
                </span>
                <button onClick={() => deleteItem(i)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-gray-500 mt-10 pb-6 text-sm">
        Built with ❤️ using React + ML | ScamShield AI
      </div>
    </div>
  );
}

export default App;