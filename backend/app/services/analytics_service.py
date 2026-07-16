import csv
import io
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models import mood_log, text_emotion_record, facial_emotion_record
from app.models.mood_log import MoodLog
from app.models.facial_emotion_record import FacialEmotionRecord

class AnalyticsService:
    def get_mood_trends(self, db: Session, user_id: int, days: int) -> list[dict]:
        """Combined mood trends from both self-reported logs and facial emotion detection."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        mood_logs = db.query(MoodLog).filter(
            and_(MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date)
        ).all()
        
        facial_records = db.query(FacialEmotionRecord).filter(
            and_(FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date)
        ).all()
        
        emotion_to_score = {
            'joy': 5, 'happiness': 5, 'happy': 5, 'surprise': 4,
            'neutral': 3, 'sadness': 2, 'sad': 2,
            'fear': 1, 'anger': 1, 'angry': 1, 'disgust': 1
        }
        
        combined_data = []
        
        for log in mood_logs:
            combined_data.append({
                "date": log.created_at.strftime("%Y-%m-%d"),
                "mood": log.mood_score,
                "source": "self-reported"
            })
        
        for record in facial_records:
            emotion_lower = record.emotion_label.lower()
            score = emotion_to_score.get(emotion_lower, 3)
            combined_data.append({
                "date": record.created_at.strftime("%Y-%m-%d"),
                "mood": score,
                "source": "facial-detection"
            })
        
        combined_data.sort(key=lambda x: x["date"])
        return combined_data
    
    def get_emotion_distribution(self, db: Session, user_id: int) -> list[dict]:
        """Default emotion distribution (returns combined data)."""
        return self.get_combined_emotion_distribution(db, user_id)
    
    def get_heatmap_data(self, db: Session, user_id: int) -> list[dict]:
        """Get weekly mood heatmap data combining both sources."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=28)
        
        mood_logs = db.query(MoodLog).filter(
            and_(MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date)
        ).all()
        
        facial_records = db.query(FacialEmotionRecord).filter(
            and_(FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date)
        ).all()
        
        emotion_to_score = {
            'joy': 5, 'happiness': 5, 'happy': 5, 'surprise': 4,
            'neutral': 3, 'sadness': 2, 'sad': 2,
            'fear': 1, 'anger': 1, 'angry': 1, 'disgust': 1
        }
        
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        data = []
        
        for log in mood_logs:
            day_idx = log.created_at.isoweekday() - 1
            current_week = datetime.now(timezone.utc).isocalendar()[1]
            log_week = log.created_at.isocalendar()[1]
            week_num = (current_week - log_week) % 52
            data.append({"week": week_num, "day": day_names[day_idx], "value": log.mood_score})
        
        for record in facial_records:
            day_idx = record.created_at.isoweekday() - 1
            current_week = datetime.now(timezone.utc).isocalendar()[1]
            record_week = record.created_at.isocalendar()[1]
            week_num = (current_week - record_week) % 52
            emotion_lower = record.emotion_label.lower()
            score = emotion_to_score.get(emotion_lower, 3)
            data.append({"week": week_num, "day": day_names[day_idx], "value": score})
        
        return data
    
    def get_correlation_data(self, db: Session, user_id: int) -> dict:
        """Compare self-reported mood vs facial emotion."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=14)
        
        moods = db.query(MoodLog.created_at, MoodLog.mood_score).filter(
            and_(MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date)
        ).order_by(MoodLog.created_at).all()
        
        faces = db.query(FacialEmotionRecord.created_at, FacialEmotionRecord.emotion_label).filter(
            and_(FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date)
        ).order_by(FacialEmotionRecord.created_at).all()
        
        return {
            "self_reported": [{"date": m.created_at.strftime("%Y-%m-%d"), "mood": m.mood_score} for m in moods],
            "facial": [{"date": f.created_at.strftime("%Y-%m-%d"), "emotion": f.emotion_label} for f in faces]
        }
    
    def get_risk_score(self, db: Session, user_id: int, days: int) -> list[dict]:
        """Calculate risk score based on combined mood data."""
        combined_data = self.get_mood_trends(db, user_id, days)
        
        data = []
        for entry in combined_data:
            mood_score = entry["mood"]
            risk = max(0, (6 - mood_score) * 20)
            data.append({"date": entry["date"], "score": risk})
        
        return data
    
    def get_text_emotion_distribution(self, db: Session, user_id: int) -> list[dict]:
        """Get emotion distribution from text/journal entries only."""
        records = db.query(
            text_emotion_record.TextEmotionRecord.emotion_label,
            func.count(text_emotion_record.TextEmotionRecord.id).label('count')
        ).filter(
            text_emotion_record.TextEmotionRecord.user_id == user_id
        ).group_by(
            text_emotion_record.TextEmotionRecord.emotion_label
        ).all()
        
        return [{"name": r.emotion_label.capitalize(), "value": r.count} for r in records]

    def get_facial_emotion_distribution(self, db: Session, user_id: int) -> list[dict]:
        """Get emotion distribution from facial recognition only."""
        records = db.query(
            facial_emotion_record.FacialEmotionRecord.emotion_label,
            func.count(facial_emotion_record.FacialEmotionRecord.id).label('count')
        ).filter(
            facial_emotion_record.FacialEmotionRecord.user_id == user_id
        ).group_by(
            facial_emotion_record.FacialEmotionRecord.emotion_label
        ).all()
        
        return [{"name": r.emotion_label.capitalize(), "value": r.count} for r in records]
 
    def get_combined_emotion_distribution(self, db: Session, user_id: int) -> list[dict]:
        """Get combined emotion distribution from both text and facial."""
        # Get text emotions
        text_records = db.query(
            text_emotion_record.TextEmotionRecord.emotion_label,
            func.count(text_emotion_record.TextEmotionRecord.id).label('count')
        ).filter(
            text_emotion_record.TextEmotionRecord.user_id == user_id
        ).group_by(
            text_emotion_record.TextEmotionRecord.emotion_label
        ).all()
        
        # Get facial emotions
        facial_records = db.query(
            facial_emotion_record.FacialEmotionRecord.emotion_label,
            func.count(facial_emotion_record.FacialEmotionRecord.id).label('count')
        ).filter(
            facial_emotion_record.FacialEmotionRecord.user_id == user_id
        ).group_by(
            facial_emotion_record.FacialEmotionRecord.emotion_label
        ).all()
        
        # Combine them using Python dictionaries
        emotion_counts = {}
        for record in text_records:
            emotion = record.emotion_label.capitalize()
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + record.count
            
        for record in facial_records:
            emotion = record.emotion_label.capitalize()
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + record.count
        
        return [{"name": name, "value": value} for name, value in emotion_counts.items()]

    def get_csv_data(self, db: Session, user_id: int) -> str:
        """Export combined mood data to CSV."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
        
        mood_logs = db.query(MoodLog).filter(
            and_(MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date)
        ).order_by(MoodLog.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Source", "Mood Score (1-5)", "Note/Emotion"])
        
        for log in mood_logs:
            writer.writerow([
                log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "Self-Reported",
                log.mood_score,
                log.note or ""
            ])
        
        facial_records = db.query(FacialEmotionRecord).filter(
            and_(FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date)
        ).order_by(FacialEmotionRecord.created_at.desc()).all()
        
        for record in facial_records:
            writer.writerow([
                record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "Facial Detection",
                record.emotion_label,
                f"Confidence: {record.confidence:.2f}"
            ])
        
        return output.getvalue()

analytics_service = AnalyticsService()