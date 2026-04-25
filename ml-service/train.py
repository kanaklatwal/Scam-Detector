import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv("data.csv")

# --- CLEAN ---
df.columns = [col.lower() for col in df.columns]

# Assume columns: url, label
df['label'] = df['label'].map({
    'phishing': 1,
    'legitimate': 0,
    1: 1,
    0: 0
})

df = df.dropna()

# --- FEATURE FUNCTION ---
def extract_features(url):
    return {
        "length": len(url),
        "https": 1 if url.startswith("https") else 0,
        "dots": url.count("."),
        "slashes": url.count("/"),
        "digits": sum(c.isdigit() for c in url),
        "has_at": 1 if "@" in url else 0,
        "has_dash": 1 if "-" in url else 0,
        "suspicious": 1 if any(word in url.lower() for word in ["login","verify","bank","free","secure"]) else 0
    }

# Apply features
features_df = df["url"].apply(extract_features).apply(pd.Series)

X = df['url'].apply(extract_features).tolist()
y = df['label']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Model (better than logistic)
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Accuracy
print("Accuracy:", model.score(X_test, y_test))

# Save
joblib.dump(model, "model.pkl")
print("Model trained & saved ✅")