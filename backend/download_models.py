import os

# 1. CRITICAL: Set the environment variable BEFORE importing transformers
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_CACHE = os.path.join(BASE_DIR, "app", "ml_models", "model_cache")
os.environ["HF_HOME"] = LOCAL_CACHE
os.makedirs(LOCAL_CACHE, exist_ok=True)

# 2. Now import transformers
from transformers import pipeline

print(f"📂 Models will be saved to: {LOCAL_CACHE}\n")

print("⬇️ Downloading Text Emotion Model (approx 300MB)...")
pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
print("✅ Text model downloaded!\n")

print("⬇️ Downloading Facial Emotion Model (approx 350MB)...")
pipeline("image-classification", model="trpakov/vit-face-expression")
print("✅ Facial model downloaded!\n")

print("🎉 All models successfully downloaded to your local project folder!")