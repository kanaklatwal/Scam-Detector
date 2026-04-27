import React, { useState, useEffect, useCallback } from "react";
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

  const [dark, setDark] = useState(true);

  const toggleTheme = () => setDark(!dark);

  // RESET
  useEffect(() => {
    setResult(null);
    setLoading(false);
    if (mode === "url") {
      setSubject("");
      setBody("");
    } else {
      setUrl("");
    }
  }, [mode]);

  // LOAD HISTORY
  useEffect(() => {
    setUrlHistory(JSON.parse(localStorage.getItem("urlHistory")) || []);
    setEmailHistory(JSON.parse(localStorage.getItem("emailHistory")) || []);
  }, []);

  // SAVE HISTORY
  const saveUrlHistory = useCallback((data) => {
    if (data.prediction === "Analyzing") return;
    const updated = [{ ...data, url }, ...urlHistory].slice(0, 5);
    setUrlHistory(updated);
    localStorage.setItem("urlHistory", JSON.stringify(updated));
  }, [urlHistory, url]);

  const saveEmailHistory = useCallback((data) => {
    const updated = [
      { ...data, url: subject || body.slice(0, 20) },
      ...emailHistory,
    ].slice(0, 5);

    setEmailHistory(updated);
    localStorage.setItem("emailHistory", JSON.stringify(updated));
  }, [emailHistory, subject, body]);

  // API
  const checkWebsite = useCallback(async () => {
    if (!url.trim()) return alert("Enter URL");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/predict", { url });
      setResult(res.data);
      saveUrlHistory(res.data);
    } catch {
      setResult({ prediction: "Error", riskScore: 0, reasons: ["Backend not connected"] });
    }

    setLoading(false);
  }, [url, saveUrlHistory]);

  const checkEmail = async () => {
    if (!subject.trim() && !body.trim()) return alert("Enter email content");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/email", { subject, body });
      setResult(res.data);
      saveEmailHistory(res.data);
    } catch {
      setResult({ prediction: "Error", riskScore: 0, reasons: ["Backend not connected"] });
    }

    setLoading(false);
  };

  // DELETE
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

  const clearAll = () => {
    if (mode === "url") {
      setUrlHistory([]);
      localStorage.removeItem("urlHistory");
    } else {
      setEmailHistory([]);
      localStorage.removeItem("emailHistory");
    }
  };

  const currentHistory = mode === "url" ? urlHistory : emailHistory;

  // COLORS + ICONS
  const getColor = (type) =>
    type === "Scam" ? "text-red-400" :
    type === "Suspicious" ? "text-yellow-400" :
    type === "Genuine" ? "text-green-400" :
    type === "Error" ? "text-red-500" :
    "text-gray-400";

  const getIcon = (type) =>
    type === "Scam" ? "❌" :
    type === "Suspicious" ? "⚠️" :
    type === "Genuine" ? "✅" :
    type === "Error" ? "🚫" :
    "⚠️";

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-purple-100 text-black"} min-h-screen`}>

      {/* NAV */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-white/10">
        <h1 className="text-xl font-semibold">🚨 ScamShield AI</h1>
        <button onClick={toggleTheme} className="bg-white/10 px-4 py-2 rounded-full">
          {dark ? "🌙" : "☀️"}
        </button>
      </div>

      {/* HERO */}
      <div className="text-center mt-20 px-4">
        <h1 className="text-5xl font-bold mb-4">
          Detect Scams <span className="text-blue-400">Instantly</span>
        </h1>

        {/* MODE */}
        <div className="flex justify-center gap-4 mb-6">
          <button onClick={() => setMode("url")} className={`px-4 py-2 rounded-full ${mode === "url" ? "bg-blue-500" : "bg-white/10"}`}>
            URL Scanner
          </button>
          <button onClick={() => setMode("email")} className={`px-4 py-2 rounded-full ${mode === "email" ? "bg-blue-500" : "bg-white/10"}`}>
            Email Scanner
          </button>
        </div>

        {/* INPUT */}
        {mode === "url" ? (
          <div className="flex justify-center">
            <div className="flex bg-white/10 rounded-2xl p-2 w-[500px]">
              <input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (!e.target.value.trim()) setResult(null);
                }}
                className="flex-1 bg-transparent outline-none px-4"
                placeholder="Paste URL..."
              />
              <button onClick={checkWebsite} className="bg-blue-500 px-6 py-2 rounded-xl">
                Scan
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-[500px] p-3 rounded-xl bg-white/10" placeholder="Subject..." />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-[500px] p-3 rounded-xl bg-white/10" rows={4} placeholder="Email content..." />
            <button onClick={checkEmail} className="bg-blue-500 px-6 py-2 rounded-xl">Check Email</button>
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center mt-10">
          <p>Loading...</p>
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <div className="text-center mt-12">
          <h2 className={`text-2xl ${getColor(result.prediction)}`}>
            {getIcon(result.prediction)} {result.prediction}
          </h2>

          <p className="text-gray-400">
            Risk Score: {result.riskScore}%
          </p>

          {/* REASONS */}
          {result.reasons && (
            <ul className="mt-4 text-yellow-300 text-sm">
              {result.reasons.map((r, i) => (
                <li key={i}>- {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* HISTORY */}
      {currentHistory.length > 0 && (
        <div className="mt-20 px-10 max-w-3xl mx-auto">
          <div className="flex justify-between mb-4">
            <h3>{mode === "url" ? "URL History" : "Email History"}</h3>
            <button onClick={clearAll} className="text-red-400">Clear</button>
          </div>

          {currentHistory.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded mb-2">
              <span>{item.url}</span>

              <div className="flex items-center gap-3">
                <span>{getIcon(item.prediction)}</span>
                <span className={getColor(item.prediction)}>
                  {item.prediction}
                </span>

                <button
                  onClick={() => deleteItem(i)}
                  className="text-red-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;