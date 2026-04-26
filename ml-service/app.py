from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import base64
import joblib
import re
import math
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

# 🔐 ENV
load_dotenv()
API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

# 📦 MODEL
model = joblib.load("model.pkl")

# 🔥 CACHE
cache = {}

# ✅ WHITELIST
SAFE_DOMAINS = [
    "google.com",
    "facebook.com",
    "youtube.com",
    "amazon.com",
    "instagram.com"
]

# ❌ BLACKLIST
SCAM_DOMAINS = [
    "login-free-offer.xyz",
    "free-money-now.xyz"
]

# -------- HELPERS --------
def get_domain(url):
    parsed = urlparse(url)
    domain = parsed.netloc
    return domain.replace("www.", "")

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

def is_safe(domain):
    return domain in SAFE_DOMAINS

def is_scam(domain):
    return domain in SCAM_DOMAINS

# -------- FEATURES --------
suspicious_words = ["login", "verify", "account", "bank", "secure", "update", "free", "win"]

def extract_features(url):
    url = str(url).lower()

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

# -------- VIRUSTOTAL --------
def check_url_virustotal(url):
    try:
        url_bytes = url.encode("utf-8")
        url_id = base64.urlsafe_b64encode(url_bytes).decode("utf-8").strip("=")

        api_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": API_KEY}

        response = requests.get(api_url, headers=headers)

        if response.status_code == 404:
            requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": url}
            )
            return {"status": "Analyzing"}

        if response.status_code != 200:
            return None

        data = response.json()
        stats = data["data"]["attributes"]["last_analysis_stats"]

        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)

        risk = malicious * 20 + suspicious * 10

        return {
            "malicious": malicious,
            "suspicious": suspicious,
            "risk": min(risk, 100)
        }

    except:
        return None

# -------- ROUTE --------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        url = data.get("url", "").lower()

        if not url:
            return jsonify({"error": "URL required"}), 400

        domain = get_domain(url)

        # 🔥 CACHE
        if url in cache:
            return jsonify(cache[url])

        # ✅ WHITELIST
        if is_safe(domain):
            result = {
                "prediction": "Genuine",
                "riskScore": 0,
                "source": "Whitelist (Trusted Domain)"
            }
            cache[url] = result
            return jsonify(result)

        # ❌ BLACKLIST
        if is_scam(domain):
            result = {
                "prediction": "Scam",
                "riskScore": 100,
                "source": "Blacklist (Known Scam)"
            }
            cache[url] = result
            return jsonify(result)

        # 🌐 VIRUSTOTAL
        vt = check_url_virustotal(url)

        if vt:
            if vt.get("status") == "Analyzing":
                return jsonify({
                    "prediction": "Analyzing",
                    "riskScore": 0,
                    "source": "VirusTotal scanning"
                })

            if vt["malicious"] > 0:
                result = {
                    "prediction": "Scam",
                    "riskScore": vt["risk"],
                    "source": "VirusTotal"
                }
                cache[url] = result
                return jsonify(result)

        # 🤖 ML FALLBACK
        features = extract_features(url)
        prob = model.predict_proba(features)[0][1]
        risk = int(prob * 100)

        if risk > 80:
            prediction = "Scam"
        elif risk < 20:
            prediction = "Genuine"
        else:
            prediction = "Suspicious"

        result = {
            "prediction": prediction,
            "riskScore": risk,
            "source": "ML Model"
        }

        cache[url] = result
        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        return jsonify({"prediction": "Error", "riskScore": 0})

# -------- RUN --------
if __name__ == "__main__":
    app.run(port=8000, debug=True)