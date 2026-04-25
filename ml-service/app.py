from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Load model (optional if you want later)
# model = joblib.load("model.pkl")

def extract_features(url):
    features = {}

    features['https'] = 1 if url.startswith("https") else 0

    suspicious_words = ["free", "cheap", "offer", "discount"]
    features['suspicious'] = 1 if any(word in url.lower() for word in suspicious_words) else 0

    features['length'] = len(url)

    return features

def simple_model(features):
    score = 0

    if features['https'] == 0:
        score += 30

    if features['suspicious'] == 1:
        score += 40

    if features['length'] > 50:
        score += 20

    return min(score, 100)

# ✅ CORRECT ROUTE
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    url = data.get("url")

    features = extract_features(url)
    risk_score = simple_model(features)

    prediction = "Scam" if risk_score > 50 else "Genuine"

    return jsonify({
        "prediction": prediction,
        "riskScore": risk_score
    })

# ✅ OPTIONAL health check
@app.route("/")
def home():
    return "ML server is running 🚀"

if __name__ == "__main__":
    app.run(port=8000, debug=True)