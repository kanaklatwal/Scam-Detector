from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
from urllib.parse import urlparse
import json
import math

# Load features order
with open("features.json", "r") as f:
    feature_names = json.load(f)

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")

# -------- HELPERS --------
def has_ip(url):
    return 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else -1

def url_length(url):
    if len(url) < 54:
        return 1
    elif len(url) > 75:
        return -1
    return 0

def has_at(url):
    return -1 if "@" in url else 1

def double_slash(url):
    return -1 if "//" in url[7:] else 1

def prefix_suffix(domain):
    return -1 if "-" in domain else 1

def subdomain(domain):
    dots = domain.count(".")
    if dots <= 1:
        return 1
    elif dots == 2:
        return 0
    return -1

def normalize_url(url):
    url = url.strip()

    # add http if missing
    if not url.startswith("http"):
        url = "http://" + url

    return url

def ssl_state(parsed):
    return 1 if parsed.scheme == "https" else -1

def https_token(domain):
    return -1 if "https" in domain else 1

# -------- FEATURE EXTRACTION --------
def extract_features(url):
    try:
        # normalize
        url = url.strip()
        if not url.startswith("http"):
            url = "http://" + url

        parsed = urlparse(url)
        domain = parsed.netloc.lower()

        if domain == "":
            domain = "invalid.com"

        feature_map = {
            "having_ip_address": has_ip(url),

            "url_length":
                1 if len(url) < 54 else (-1 if len(url) > 75 else 0),

            "having_at_symbol":
                -1 if "@" in url else 1,

            "double_slash_redirecting":
                -1 if "//" in url[7:] else 1,

            "prefix_suffix":
                -1 if "-" in domain else 1,

            "having_sub_domain":
                1 if domain.count('.') <= 1 else (0 if domain.count('.') == 2 else -1),

            "sslfinal_state":
                1 if parsed.scheme == "https" else -1,

            "https_token":
                -1 if "https" in domain else 1
        }

        # 🔥 SAFE BUILD
        features = []
        for col in feature_names:
            features.append(feature_map.get(col, 0))

        return [features]

    except Exception as e:
        print("❌ Feature error:", e)

        # fallback (never crash)
        return [[0] * len(feature_names)]

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

        features = extract_features(url)
        print("Features:", features)  # debug

        pred = model.predict(features)[0]
        prob = model.predict_proba(features)[0][1]

        return jsonify({
            "prediction": "Scam" if pred == 1 else "Genuine",
            "riskScore": int(prob * 100)
        })

    except Exception as e:
        print("❌ Prediction crash:", e)
        return jsonify({
            "prediction": "Error",
            "riskScore": 0
        }), 200

# -------- RUN --------
if __name__ == "__main__":
    app.run(port=8000, debug=True)