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

load_dotenv()
API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

model = joblib.load("model.pkl")

cache = {}

SAFE_DOMAINS = [
    "google.com",
    "facebook.com",
    "youtube.com",
    "amazon.com",
    "instagram.com"
]

SCAM_DOMAINS = [
    "login-free-offer.xyz",
    "free-money-now.xyz"
]

# -------- HELPERS --------

def clean_url(url):
    url = url.strip()
    if not url.startswith("http"):
        url = "http://" + url
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return None
        return url
    except:
        return None

def get_domain(url):
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]
    return domain

def entropy(s):
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum([p * math.log2(p) for p in prob])

def is_random_string(url):
    letters = re.sub(r'[^a-z]', '', url.lower())
    if len(letters) < 5:
        return 0
    unique_ratio = len(set(letters)) / len(letters)
    return 1 if unique_ratio > 0.5 else 0

def is_safe(domain):
    return any(domain == d or domain.endswith("." + d) for d in SAFE_DOMAINS)

def is_scam(domain):
    return domain in SCAM_DOMAINS

# -------- FEATURES --------

suspicious_words = ["login", "verify", "account", "bank", "secure", "update", "free", "win"]

def extract_features(url):
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
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
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

        if malicious == 0 and suspicious == 0:
            return {"prediction": "Genuine", "riskScore": 5, "source": "VirusTotal"}

        if malicious > 0:
            return {"prediction": "Scam", "riskScore": min(100, malicious * 20), "source": "VirusTotal"}

        if suspicious > 0:
            return {"prediction": "Suspicious", "riskScore": min(100, suspicious * 10), "source": "VirusTotal"}

    except Exception as e:
        print("VT Error:", e)
        return None

# -------- ROUTES --------

@app.route("/")
def home():
    return "🚀 Scam Detection API is running"


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        url = clean_url(data.get("url", ""))

        print("Incoming URL:", url)

        if not url:
            return jsonify({"prediction": "Invalid", "riskScore": 90})

        domain = get_domain(url)

        # CACHE
        if url in cache:
            print("Cache hit")
            return jsonify(cache[url])

        # WHITELIST
        if is_safe(domain):
            result = {"prediction": "Genuine", "riskScore": 0, "source": "Whitelist"}
            cache[url] = result
            return jsonify(result)

        # BLACKLIST
        if is_scam(domain):
            result = {"prediction": "Scam", "riskScore": 100, "source": "Blacklist"}
            cache[url] = result
            return jsonify(result)

        # FEATURES
        features = extract_features(url)
        entropy_value = features[0][-1]
        random_flag = features[0][-2]

        # HEURISTIC
        if (
            entropy_value > 3.8 or
            random_flag == 1 or
            len(domain) > 25 or
            not re.search(r"\.[a-z]{2,}$", domain)
        ):
            result = {
                "prediction": "Suspicious",
                "riskScore": 70,
                "source": "Heuristic"
            }
            cache[url] = result
            return jsonify(result)

        # VIRUSTOTAL
        vt = check_url_virustotal(url)

        if vt:
            if vt.get("status") == "Analyzing":
                print("VT analyzing → fallback ML")

                prob = model.predict_proba(features)[0][1]
                risk = int(prob * 100)

                prediction = (
                    "Scam" if risk > 75 else
                    "Genuine" if risk < 25 else
                    "Suspicious"
                )

                result = {
                    "prediction": prediction,
                    "riskScore": risk,
                    "source": "ML (fallback)"
                }

                cache[url] = result
                return jsonify(result)

            cache[url] = vt
            return jsonify(vt)

        # ML MODEL
        prob = model.predict_proba(features)[0][1]
        risk = int(prob * 100)

        if risk > 75:
            prediction = "Scam"
        elif risk < 25:
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
        return jsonify({
            "prediction": "Error",
            "riskScore": 0,
            "message": str(e)
        })


# -------- RUN --------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)