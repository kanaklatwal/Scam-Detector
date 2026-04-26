import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import json

# =========================
# 1. LOAD DATA
# =========================
df = pd.read_csv(
    "../fraudulent-website-detection/data/ALL-phishing-links.txt",
    header=None,
    sep=",",
    engine="python",
    on_bad_lines="skip"
)

# Take only needed columns
df = df.iloc[:, :3]
df.columns = ["id", "url", "source"]

# Keep only url
df = df[["url"]]

# All are phishing
df["label"] = 1

df = df.dropna(subset=["url"])
df["url"] = df["url"].astype(str)

# =========================
# 2. CREATE FEATURES
# =========================
def extract_features(url):
    try:
        if not isinstance(url, str):
            return [0,0,0,0,0,0,0]
        return [
           len(url),                 # length
           url.count("."),           # dots
           url.count("-"),           # hyphens
           url.count("/"),           # slashes
           int("https" in url),      # https or not
           int("@" in url),          # @ symbol
            int("//" in url[8:]),     # double slash redirect
        ]
    except Exception as e:
        return [0,0,0,0,0,0,0]

# Apply feature extraction
X = np.array(df["url"].apply(extract_features).tolist())
y = df["label"]

# ⚠️ Add fake legit data (for demo balance)
df_legit = df.sample(5000, random_state=42)
df_legit["label"] = 0

X_legit = np.array(df_legit["url"].apply(extract_features).tolist())
y_legit = df_legit["label"]

# Combine
X = np.vstack((X, X_legit))
y = np.concatenate((y, y_legit))

print("Data ready:", X.shape)

# =========================
# 3. TRAIN MODEL
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

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
# 4. SAVE MODEL
# =========================
joblib.dump(model, "model.pkl")

# Save feature order (important for app.py)
feature_names = [
    "url_length",
    "dot_count",
    "hyphen_count",
    "slash_count",
    "https",
    "at_symbol",
    "double_slash"
]

with open("features.json", "w") as f:
    json.dump(feature_names, f)

print("✅ Model + features saved")