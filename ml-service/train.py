import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import json

# Load dataset
df = pd.read_csv("dataset.csv")

# 🔥 Clean column names
df.columns = df.columns.str.strip().str.lower()

print("Columns:", df.columns.tolist())

# Drop index if exists
if "index" in df.columns:
    df = df.drop(columns=["index"])

# Rename label
if "result" in df.columns:
    df = df.rename(columns={"result": "label"})

# Fix label
df['label'] = df['label'].map({
    -1: 1,  # phishing
     1: 0   # legit
})

# 🔥 FINAL FEATURE SET (balanced + realistic)
selected_cols = [
    "having_ip_address",
    "url_length",
    "having_at_symbol",
    "double_slash_redirecting",
    "prefix_suffix",
    "having_sub_domain",
    "sslfinal_state",
    "https_token"
]

# Keep only existing columns (safe)
selected_cols = [col for col in selected_cols if col in df.columns]

print("Selected features:", selected_cols)

# Final dataset
df = df[selected_cols + ["label"]]

print(df['label'].value_counts())

# Split
X = df.drop("label", axis=1)
y = df["label"]

print("Feature order:", X.columns.tolist())

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 🔥 Improved model
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

print("Train Accuracy:", model.score(X_train, y_train))
print("Test Accuracy:", model.score(X_test, y_test))

# Save model
joblib.dump(model, "model.pkl")

# Save feature order
with open("features.json", "w") as f:
    json.dump(X.columns.tolist(), f)

print("Model + features saved ✅")