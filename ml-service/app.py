from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import base64
import joblib
import re
import math

app = Flask(__name__)
CORS(app)

# 🔐 Load .env
load_dotenv()
API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

# 📦 Load ML model
model = joblib.load("model.pkl")

# -------- HELPERS --------
def entropy(s):
    s = str(s)
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum([p * math.log2(p) for p in prob])

def is_random_string(url):
    letters = re.sub(r'[^a-z]', '', url.lower())
    if len(letters) == 0:
        return 0
    unique_ratio = len(set(letters)) / len(letters)
    return 1 if unique_ratio > 0.6 else 0

suspicious_words = ["login", "verify", "account", "bank", "secure", "update", "free", "win"]

# -------- ML FEATURES --------
def extract_features(url):
    url = str(url).strip().lower()

    if not url.startswith("http"):
        url = "http://" + url

    keyword_flag = 1 if any(word in url for word in suspicious_words) else 0
    random_flag = is_random_string(url)
    entropy_value = entropy(url)

    return [[
        len(url),
        url.count("."),
        url.count("-"),
        url.count("/"),
        url.count("@"),
        int("https" in url),
        int("http" in url),
        int("www" in url),
        int(".com" in url),
        sum(c.isdigit() for c in url),
        keyword_flag,
        random_flag,
        entropy_value
    ]]

# -------- VIRUSTOTAL CHECK --------
def check_url_virustotal(url):
    try:
        url_bytes = url.encode("utf-8")
        url_id = base64.urlsafe_b64encode(url_bytes).decode("utf-8").strip("=")

        api_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": API_KEY}

        response = requests.get(api_url, headers=headers)

        # ⏳ If not analyzed yet
        if response.status_code != 200:
            requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": url}
            )
            return {
                "prediction": "Analyzing",
                "riskScore": 0
            }

        data = response.json()
        stats = data["data"]["attributes"]["last_analysis_stats"]

        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)

        risk = malicious * 20 + suspicious * 10

        if malicious == 0 and suspicious == 0:
            return {"prediction": "Genuine", "riskScore": 5}
        else:
            return {"prediction": "Scam", "riskScore": min(risk, 100)}

    except Exception as e:
        print("❌ VT error:", e)
        return None

# -------- ROUTES --------
@app.route("/")
def home():
    return "ML server running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        url = data.get("url")

        if not url:
            return jsonify({"error": "URL required"}), 400

        # 🔥 STEP 1: VirusTotal
        vt_result = check_url_virustotal(url)
        if vt_result:
            return jsonify(vt_result)

        # 🔥 STEP 2: ML fallback
        features = extract_features(url)
        pred = model.predict(features)[0]
        prob = model.predict_proba(features)[0][1]

        return jsonify({
            "prediction": "Scam" if pred == 1 else "Genuine",
            "riskScore": int(prob * 100)
        })

    except Exception as e:
        print("❌ Prediction error:", e)
        return jsonify({
            "prediction": "Error",
            "riskScore": 0
        })

# -------- RUN --------
if __name__ == "__main__":
    app.run(port=8000, debug=True)