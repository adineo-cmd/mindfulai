import pytest
from app.services.text_emotion_service import text_emotion_service

def test_text_emotion_prediction():
    text = "I am feeling absolutely wonderful and joyful today!"
    result = text_emotion_service.predict(text)
    
    assert "emotion_label" in result
    assert "confidence" in result
    assert "sentiment_polarity" in result
    assert result["sentiment_polarity"] > 0  # VADER should detect positive
    assert result["emotion_label"] in ["joy", "love", "surprise"]