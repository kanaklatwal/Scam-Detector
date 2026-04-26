from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json

app = Flask(__name__)
CORS(app)

# Load model
model = joblib.load("model.pkl")

# Load feature order
with open("features.json", "r") as f:
    feature_names = json.load(f)

# -------- FEATURE EXTRACTION (MATCH TRAIN.PY) --------
def extract_features(url):
    try:
        url = str(url).strip()

        if not url.startswith("http"):
            url = "http://" + url

        features = [
            len(url),                 # url_length
            url.count("."),           # dot_count
            url.count("-"),           # hyphen_count
            url.count("/"),           # slash_count
            int("https" in url),      # https
            int("@" in url),          # at_symbol
            int("//" in url[8:])      # double slash
        ]

        return [features]

    except Exception as e:
        print("❌ Feature error:", e)
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
        print("Features:", features)

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