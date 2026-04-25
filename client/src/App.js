import React, { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkWebsite = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", {
        url: url,
      });
      setResult(res.data);
    } catch (err) {
      console.log(err);
      alert("Backend not connected");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-[420px] text-center text-white">
        
        <h1 className="text-3xl font-bold mb-6">
          🚨 Scam Detector
        </h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-2 rounded-lg text-black outline-none"
          />
          <button
            onClick={checkWebsite}
            className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Check
          </button>
        </div>

        {loading && (
          <p className="mt-4 animate-pulse text-blue-300">
            Checking...
          </p>
        )}

        {result && (
          <div className="mt-6">
            <h2 className={`text-xl font-semibold ${
              result.prediction === "Scam" ? "text-red-400" : "text-green-400"
            }`}>
              {result.prediction}
            </h2>

            <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
              <div
                className="bg-red-500 h-3 rounded-full"
                style={{ width: `${result.riskScore}%` }}
              ></div>
            </div>

            <p className="mt-2 text-gray-300">
              Risk Score: {result.riskScore}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;