import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import joblib

# Load dataset
df = pd.read_csv("data.csv")

# OPTIONAL: agar column name mismatch ho
df = df.rename(columns={
    "URL": "url",
    "Label": "label"
})

# OPTIONAL: agar label text me hai
df["label"] = df["label"].map({
    "legitimate": 0,
    "phishing": 1
}).fillna(df["label"])

# Simple feature: URL length
df["length"] = df["url"].apply(len)

X = df[["length"]]
y = df["label"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train
model = LogisticRegression()
model.fit(X_train, y_train)

# Save model
joblib.dump(model, "model.pkl")

print("Model trained and saved ✅")