from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.ml_models.transformer_loader import model_cache

vader = SentimentIntensityAnalyzer()

class TextEmotionService:
    def predict(self, text: str) -> dict:
        pipeline = model_cache.load_text_emotion()
        results = pipeline(text)[0]
        
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        dominant = results[0]
        
        # VADER polarity
        vader_scores = vader.polarity_scores(text)
        
        return {
            "emotion_label": dominant['label'],
            "confidence": dominant['score'],
            "all_scores": {r['label']: r['score'] for r in results},
            "sentiment_polarity": vader_scores['compound']
        }

text_emotion_service = TextEmotionService()