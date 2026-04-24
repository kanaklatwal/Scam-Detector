from flask import Flask, request, jsonify
import random
import re

app = Flask(__name__)

def extract_features(url):
    features = {}

    # HTTPS check
    features['https'] = 1 if url.startswith("https") else 0

    # Suspicious keywords
    suspicious_words = ["free", "cheap", "offer", "discount"]
    features['suspicious'] = 1 if any(word in url.lower() for word in suspicious_words) else 0

    # Length of URL
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

if __name__ == "__main__":
    app.run(port=8000)