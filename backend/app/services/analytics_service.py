import csv
import io
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models import mood_log, text_emotion_record, facial_emotion_record

class AnalyticsService:
    
    def get_mood_trends(self, db: Session, user_id: int, days: int) -> list[dict]:
        logs = db.query(mood_log.MoodLog).filter(
            mood_log.MoodLog.user_id == user_id
        ).order_by(mood_log.MoodLog.created_at.desc()).limit(days).all()
        
        return [{"date": log.created_at.strftime("%Y-%m-%d"), "mood": log.mood_score} for log in reversed(logs)]

    def get_emotion_distribution(self, db: Session, user_id: int) -> list[dict]:
        records = db.query(
            text_emotion_record.TextEmotionRecord.emotion_label, 
            func.count(text_emotion_record.TextEmotionRecord.id).label('count')
        ).filter(
            text_emotion_record.TextEmotionRecord.user_id == user_id
        ).group_by(text_emotion_record.TextEmotionRecord.emotion_label).all()
        
        return [{"name": r.emotion_label.capitalize(), "value": r.count} for r in records]

    def get_heatmap_data(self, db: Session, user_id: int) -> list[dict]:
        # FIX: Use timezone-aware UTC time
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=28)
        logs = db.query(mood_log.MoodLog).filter(
            and_(
                mood_log.MoodLog.user_id == user_id,
                mood_log.MoodLog.created_at >= cutoff_date
            )
        ).all()
        
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        data = []
        
        for log in logs:
            day_idx = log.created_at.isoweekday() - 1
            
            current_week = datetime.now(timezone.utc).isocalendar()[1]
            log_week = log.created_at.isocalendar()[1]
            week_num = (current_week - log_week) % 52
            
            data.append({
                "week": week_num,
                "day": day_names[day_idx],
                "value": log.mood_score
            })
        return data

    def get_correlation_data(self, db: Session, user_id: int) -> dict:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=14)
        
        moods = db.query(mood_log.MoodLog.created_at, mood_log.MoodLog.mood_score).filter(
            and_(
                mood_log.MoodLog.user_id == user_id,
                mood_log.MoodLog.created_at >= cutoff_date
            )
        ).order_by(mood_log.MoodLog.created_at).all()
        
        faces = db.query(facial_emotion_record.FacialEmotionRecord.created_at, facial_emotion_record.FacialEmotionRecord.emotion_label).filter(
            and_(
                facial_emotion_record.FacialEmotionRecord.user_id == user_id,
                facial_emotion_record.FacialEmotionRecord.created_at >= cutoff_date
            )
        ).order_by(facial_emotion_record.FacialEmotionRecord.created_at).all()
        
        return {
            "self_reported": [{"date": m.created_at.strftime("%Y-%m-%d"), "mood": m.mood_score} for m in moods],
            "facial": [{"date": f.created_at.strftime("%Y-%m-%d"), "emotion": f.emotion_label} for f in faces]
        }

    def get_risk_score(self, db: Session, user_id: int, days: int) -> list[dict]:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        logs = db.query(mood_log.MoodLog).filter(
            and_(
                mood_log.MoodLog.user_id == user_id,
                mood_log.MoodLog.created_at >= cutoff_date
            )
        ).order_by(mood_log.MoodLog.created_at).all()
        
        data = []
        for log in logs:
            # FIX: Adjusted math so a mood of 5 = 0 risk, and 1 = 100 risk
            risk = max(0, (5 - log.mood_score) * 25) 
            data.append({
                "date": log.created_at.strftime("%Y-%m-%d"),
                "score": risk
            })
        return data

    def get_csv_data(self, db: Session, user_id: int) -> str:
        logs = db.query(mood_log.MoodLog).filter(
            mood_log.MoodLog.user_id == user_id
        ).order_by(mood_log.MoodLog.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Mood Score (1-5)", "Note", "Sleep Hours", "Screen Time"])
        
        for log in logs:
            writer.writerow([
                log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                log.mood_score,
                log.note or "",
                log.sleep_hours or "",
                log.screen_time or ""
            ])
            
        return output.getvalue()

analytics_service = AnalyticsService()