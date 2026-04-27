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

  // SAVE URL HISTORY
  const saveUrlHistory = useCallback((data) => {
    if (data.prediction === "Analyzing") return;

    const updated = [{ ...data, url }, ...urlHistory].slice(0, 5);
    setUrlHistory(updated);
    localStorage.setItem("urlHistory", JSON.stringify(updated));
  }, [urlHistory, url]);

  // SAVE EMAIL HISTORY
  const saveEmailHistory = useCallback((data) => {
    const updated = [
      { ...data, url: subject || "Email Scan" },
      ...emailHistory,
    ].slice(0, 5);

    setEmailHistory(updated);
    localStorage.setItem("emailHistory", JSON.stringify(updated));
  }, [emailHistory, subject]);

  // URL CHECK
  const checkWebsite = useCallback(async () => {
    if (!url.trim()) return alert("Enter URL");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/predict", { url });
      setResult(res.data);
      saveUrlHistory(res.data);
    } catch {
      alert("Backend not connected");
    }

    setLoading(false);
  }, [url, saveUrlHistory]);

  // EMAIL CHECK
  const checkEmail = async () => {
    if (!subject && !body) return alert("Enter email content");

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/email", {
        subject,
        body,
      });
      setResult(res.data);
      saveEmailHistory(res.data);
    } catch {
      alert("Backend not connected");
    }

    setLoading(false);
  };

  // LOAD HISTORY
  useEffect(() => {
    setUrlHistory(JSON.parse(localStorage.getItem("urlHistory")) || []);
    setEmailHistory(JSON.parse(localStorage.getItem("emailHistory")) || []);
  }, []);

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

  // CLEAR
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

  const isScam = result?.prediction === "Scam";
  const isSuspicious = result?.prediction === "Suspicious";

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen`}>

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

        <p className="text-gray-400 mb-6">
          URL + Email Scam Detection System
        </p>

        {/* TOGGLE */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded-full ${
              mode === "url" ? "bg-blue-500" : "bg-white/10"
            }`}
          >
            URL Scanner
          </button>

          <button
            onClick={() => setMode("email")}
            className={`px-4 py-2 rounded-full ${
              mode === "email" ? "bg-blue-500" : "bg-white/10"
            }`}
          >
            Email Scanner
          </button>
        </div>

        {/* URL INPUT */}
        {mode === "url" && (
          <div className="flex justify-center">
            <div className="flex bg-white/10 rounded-2xl p-2 w-[500px] max-w-full">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="🔍 Paste suspicious URL..."
                className="flex-1 bg-transparent outline-none px-4 py-3"
              />

              <button onClick={checkWebsite} className="bg-blue-500 px-6 py-3 rounded-xl">
                {loading ? "..." : "Scan"}
              </button>
            </div>
          </div>
        )}

        {/* EMAIL INPUT */}
        {mode === "email" && (
          <div className="flex flex-col items-center gap-3">
            <input
              placeholder="Subject..."
              className="w-[500px] p-3 rounded-xl bg-white/10"
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              placeholder="Paste email content..."
              className="w-[500px] p-3 rounded-xl bg-white/10"
              rows={4}
              onChange={(e) => setBody(e.target.value)}
            />

            <button onClick={checkEmail} className="bg-blue-500 px-6 py-3 rounded-xl">
              {loading ? "..." : "Check Email"}
            </button>
          </div>
        )}
      </div>

      {/* RESULT */}
      {loading && (
        <div className="flex justify-center mt-10">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {result && !loading && (
        <div className="text-center mt-12">
          <h2 className={`text-2xl font-semibold ${
            isScam ? "text-red-400"
            : isSuspicious ? "text-yellow-400"
            : "text-green-400"
          }`}>
            {result.prediction}
          </h2>

          <p className="text-gray-400">
            Risk Score: {result.riskScore}%
          </p>

          {/* 🔥 REASONS */}
          {result.reasons && result.reasons.length > 0 && (
            <div className="mt-4 text-yellow-300 text-sm">
              <p>⚠️ Reasons:</p>
              <ul>
                {result.reasons.map((r, i) => (
                  <li key={i}>- {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {currentHistory.length > 0 && (
        <div className="mt-20 px-10 max-w-3xl mx-auto">

          <div className="flex justify-between mb-6">
            <h3>{mode === "url" ? "URL History" : "Email History"}</h3>

            <button onClick={clearAll} className="text-red-400">
              Clear All
            </button>
          </div>

          {currentHistory.map((item, i) => (
            <div key={i} className="flex justify-between bg-white/5 p-4 mb-2 rounded">
              <span>{item.url}</span>

              <div className="flex gap-2">
                <span>{item.prediction}</span>

                <button onClick={() => deleteItem(i)}>
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-20 pb-10 text-sm text-gray-500">
        Built with ❤️ using AI + ML
      </div>
    </div>
  );
}

export default App;