import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import json
import re
import math

# =========================
# LOAD DATA
# =========================
df = pd.read_csv("dataset_phishing.csv")

# Fix label
df = df.rename(columns={"status": "label"})
df["label"] = df["label"].astype(str).str.lower()

df["label"] = df["label"].map({
    "phishing": 1,
    "legitimate": 0
})

df = df.dropna(subset=["label"])

def entropy(s):
    s = str(s)
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum([p * math.log2(p) for p in prob])

def is_random_string(s):
    letters = re.sub(r'[^a-z]', '', s)
    if len(letters) == 0:
        return 0
    unique_ratio = len(set(letters)) / len(letters)
    return 1 if unique_ratio > 0.6 else 0

# =========================
# FEATURE EXTRACTION (URL BASED)
# =========================

suspicious_words = ["login", "verify", "account", "bank", "secure", "update", "free", "win"]

def extract_features(url):
    url = str(url).lower()

    if not url.startswith("http"):
        url = "http://" + url

    keyword_flag = 1 if any(word in url for word in suspicious_words) else 0
    random_flag = is_random_string(url) 
    entropy_value = entropy(url) 

    return [
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
    ]


# Apply features
X = np.array(df["url"].apply(extract_features).tolist())
y = df["label"].values

# =========================
# SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# =========================
# MODEL
# =========================
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

print("Train Accuracy:", model.score(X_train, y_train))
print("Test Accuracy:", model.score(X_test, y_test))

# =========================
# SAVE
# =========================
joblib.dump(model, "model.pkl")

feature_names = [
    "length",
    "dots",
    "hyphens",
    "slashes",
    "ats",
    "https",
    "http",
    "www",
    "com",
    "digits",
    "keywords",
    "random",
    "entropy"
]

with open("features.json", "w") as f:
    json.dump(feature_names, f)

print("✅ Model saved")