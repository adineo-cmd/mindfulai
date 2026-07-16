import os
import logging
from transformers import pipeline

logger = logging.getLogger(__name__)

# 1. Define the path to your model_cache folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_CACHE_DIR = os.path.join(BASE_DIR, "model_cache")

# 2. Create the folder if it doesn't exist yet
os.makedirs(LOCAL_CACHE_DIR, exist_ok=True)

class ModelCache:
    def __init__(self):
        self.text_emotion_pipeline = None
        self.facial_emotion_pipeline = None

    def load_text_emotion(self):
        if not self.text_emotion_pipeline:
            logger.info("Loading text emotion model...")
            # ✅ FIX: Remove cache_dir from pipeline(), use model_kwargs instead
            self.text_emotion_pipeline = pipeline(
                "text-classification", 
                model="j-hartmann/emotion-english-distilroberta-base", 
                return_all_scores=True,
                model_kwargs={"cache_dir": LOCAL_CACHE_DIR}  # ✅ Pass via model_kwargs
            )
        return self.text_emotion_pipeline

    def load_facial_emotion(self):
        if not self.facial_emotion_pipeline:
            logger.info("Loading facial emotion model...")
            # ✅ FIX: Remove cache_dir entirely, or use model_kwargs
            self.facial_emotion_pipeline = pipeline(
                "image-classification", 
                model="trpakov/vit-face-expression",
                model_kwargs={"cache_dir": LOCAL_CACHE_DIR}  # ✅ Pass via model_kwargs
            )
        return self.facial_emotion_pipeline

model_cache = ModelCache()