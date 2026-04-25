from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)
model = joblib.load("model.pkl")

def extract_features(url):
    return [[
        len(url),
        1 if url.startswith("https") else 0,
        url.count("."),
        url.count("/"),
        sum(c.isdigit() for c in url),
        1 if "@" in url else 0,
        1 if "-" in url else 0,
        1 if any(word in url.lower() for word in ["login","verify","bank","free","secure"]) else 0
    ]]

@app.route("/")
def home():
    return "ML server running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    url = data.get("url")

    features = [[len(url)]]
    pred = model.predict(features)[0] 
    prob = model.predict_proba(features)[0][1]

    return jsonify({
        "prediction": "Scam" if pred == 1 else "Genuine",
        "riskScore": int(prob * 100)
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)