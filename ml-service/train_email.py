import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib

# load
df = pd.read_csv("spam_ham_dataset.csv", encoding="latin-1")

print("Columns:", df.columns)

# ✅ FIX: correct columns pick karo
df = df[['text', 'label_num']]

df.columns = ['text', 'label']

# clean
df = df.dropna()
df['text'] = df['text'].astype(str)

print("Cleaned shape:", df.shape)

# split
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42
)

# vectorize
vectorizer = TfidfVectorizer(stop_words='english')
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# train
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# accuracy
acc = model.score(X_test_vec, y_test)
print("Accuracy:", acc)

# save
joblib.dump(model, "email_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("✅ Email model saved")