from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import re

app = Flask(__name__)
CORS(app)

# Load model
model = joblib.load("model.pkl")

# -------- HELPERS --------
def is_random_string(url):
    letters = re.sub(r'[^a-z]', '', url.lower())
    if len(letters) == 0:
        return 0
    unique_ratio = len(set(letters)) / len(letters)
    return 1 if unique_ratio > 0.6 else 0

suspicious_words = ["login", "verify", "account", "bank", "secure", "update", "free", "win"]

# -------- FEATURE EXTRACTION --------
def extract_features(url):
    try:
        url = str(url).strip().lower()

        if not url:
            return [[0]*12]

        if not url.startswith("http"):
            url = "http://" + url

        keyword_flag = 1 if any(word in url for word in suspicious_words) else 0
        random_flag = is_random_string(url)

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
            random_flag
        ]]

    except Exception as e:
        print("❌ Feature error:", e)
        return [[0]*12]

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
        
        if is_random_string(url) == 1:
             return jsonify({
                 "prediction": "Scam",
                 "riskScore": 85
             })
        features = extract_features(url)
        print("Features:", features)

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
        }), 200

# -------- RUN --------
if __name__ == "__main__":
    app.run(port=8000, debug=True)