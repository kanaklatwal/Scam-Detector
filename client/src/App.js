import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("url");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dark, setDark] = useState(true);

  const [urlHistory, setUrlHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);

  const normalize = (t) => t?.toLowerCase();

  useEffect(() => {
    setUrlHistory(JSON.parse(localStorage.getItem("urlHistory")) || []);
    setEmailHistory(JSON.parse(localStorage.getItem("emailHistory")) || []);
  }, []);

  const formatResponse = (data) => ({
    prediction: data.prediction,
    riskScore: data.riskScore || data.risk_score || 0,
    reasons: data.reasons || ["No details available"],
  });

  const saveUrlHistory = (data) => {
    const updated = [{ url, prediction: data.prediction }, ...urlHistory].slice(0, 5);
    setUrlHistory(updated);
    localStorage.setItem("urlHistory", JSON.stringify(updated));
  };

  const saveEmailHistory = (data) => {
    const updated = [
      { url: subject || body.slice(0, 20), prediction: data.prediction },
      ...emailHistory,
    ].slice(0, 5);

    setEmailHistory(updated);
    localStorage.setItem("emailHistory", JSON.stringify(updated));
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

      const formatted = formatResponse(res.data);
      setResult(formatted);
      saveUrlHistory(formatted);
    } catch {
      setResult({
        prediction: "Error",
        riskScore: 0,
        reasons: ["Backend not connected"],
      });
    }

    setLoading(false);
  };

  const checkEmail = async () => {
    if (!subject.trim() && !body.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "https://scam-detector-2-rkdu.onrender.com/email",
        { subject, body }
      );

      const formatted = formatResponse(res.data);
      setResult(formatted);
      saveEmailHistory(formatted);
    } catch {
      setResult({
        prediction: "Error",
        riskScore: 0,
        reasons: ["Backend not connected"],
      });
    }

    setLoading(false);
  };

  const getColor = (type) => {
    const t = normalize(type);
    return t === "scam"
      ? "text-red-500"
      : t === "suspicious"
      ? "text-yellow-400"
      : t === "error"
      ? "text-gray-400"
      : "text-green-500";
  };

  const getIcon = (type) => {
    const t = normalize(type);
    return t === "scam"
      ? "❌"
      : t === "suspicious"
      ? "⚠️"
      : t === "error"
      ? "🚫"
      : "✅";
  };

  const currentHistory = mode === "url" ? urlHistory : emailHistory;

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen`}>

      {/* HEADER */}
      <div className="text-center pt-16">
        <h1 className="text-5xl font-bold">
          Detect Scams <span className="text-blue-500">Instantly</span>
        </h1>

        <p className="text-gray-400 mt-3">
          ScamShield AI helps you identify fraudulent websites and suspicious emails using ML.
        </p>
      </div>

      {/* TOGGLE */}
      <div className="text-center mt-4">
        <button
          onClick={() => setDark(!dark)}
          className="bg-blue-500 px-3 py-1 rounded"
        >
          Toggle Mode
        </button>
      </div>

      {/* MODE */}
      <div className="flex justify-center gap-4 mt-6">
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
              className="px-4 py-2 rounded bg-gray-800 w-[320px]"
              placeholder="Enter URL"
            />
            <button onClick={checkWebsite} className="bg-blue-500 px-4 rounded">
              Scan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-[320px]">
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

      {/* RESULT */}
      {loading && <div className="text-center mt-6">⏳ Checking...</div>}

      {result && !loading && (
        <div className="flex justify-center mt-10">
          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg w-[350px] text-center animate-bounce">
            <h2 className={`text-2xl ${getColor(result.prediction)}`}>
              {getIcon(result.prediction)} {result.prediction}
            </h2>

            <p className="mt-2">Risk Score: {result.riskScore}%</p>

            <ul className="mt-4 text-gray-300 text-sm">
              {result.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {currentHistory.length > 0 && (
        <div className="mt-10 px-10">
          <h3 className="mb-3">{mode === "url" ? "URL History" : "Email History"}</h3>

          {currentHistory.map((item, i) => (
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