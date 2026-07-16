from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from io import BytesIO

from app.db.session import get_db
from app.models import text_emotion_record, facial_emotion_record
from app.services.analytics_service import analytics_service
from app.services.pdf_export_service import pdf_export_service

router = APIRouter(prefix="/api/mood", tags=["analytics"])

# --- Standard Chart Data ---

@router.get("/trends")
def get_trends(days: int = Query(default=7, le=365), db: Session = Depends(get_db)):
    """Get mood trend data for line charts (7, 30, or 90 days)."""
    user_id = 1
    data = analytics_service.get_mood_trends(db, user_id=user_id, days=days)
    return {"status": "success", "data": data}

@router.get("/emotions")
def get_emotions(
    source: str = "all",  # "all", "text", or "facial"
    db: Session = Depends(get_db)
):
    """Get emotion distribution data"""
    user_id = 1
    
    if source == "text":
        data = analytics_service.get_text_emotion_distribution(db, user_id)
    elif source == "facial":
        data = analytics_service.get_facial_emotion_distribution(db, user_id)
    else:
        # "all" - combine both
        data = analytics_service.get_combined_emotion_distribution(db, user_id)
    
    return {"status": "success", "data": data}

@router.get("/emotions/text")
def get_text_emotions(db: Session = Depends(get_db)):
    """Get emotion distribution from text analysis only"""
    user_id = 1
    records = db.query(
        text_emotion_record.TextEmotionRecord.emotion_label,
        func.count(text_emotion_record.TextEmotionRecord.id).label('count')
    ).filter(
        text_emotion_record.TextEmotionRecord.user_id == user_id
    ).group_by(text_emotion_record.TextEmotionRecord.emotion_label).all()
    
    return {
        "status": "success",
        "data": [{"name": r.emotion_label.capitalize(), "value": r.count} for r in records]
    }

@router.get("/emotions/facial")
def get_facial_emotions(db: Session = Depends(get_db)):
    """Get emotion distribution from facial analysis only"""
    user_id = 1
    records = db.query(
        facial_emotion_record.FacialEmotionRecord.emotion_label,
        func.count(facial_emotion_record.FacialEmotionRecord.id).label('count')
    ).filter(
        facial_emotion_record.FacialEmotionRecord.user_id == user_id
    ).group_by(facial_emotion_record.FacialEmotionRecord.emotion_label).all()
    
    return {
        "status": "success",
        "data": [{"name": r.emotion_label.capitalize(), "value": r.count} for r in records]
    }

# --- Advanced Analytics Data ---

@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    """Get weekly mood heatmap data for the calendar view."""
    user_id = 1
    data = analytics_service.get_heatmap_data(db, user_id=user_id)
    return {"status": "success", "data": data}

@router.get("/correlation")
def get_correlation(db: Session = Depends(get_db)):
    """Get text vs. facial emotion correlation data."""
    user_id = 1
    data = analytics_service.get_correlation_data(db, user_id=user_id)
    return {"status": "success", "data": data}

@router.get("/risk-score")
def get_risk_score(days: int = Query(default=30, le=90), db: Session = Depends(get_db)):
    """Get the composite burnout/stress risk score over time."""
    user_id = 1
    data = analytics_service.get_risk_score(db, user_id=user_id, days=days)
    return {"status": "success", "data": data}

# --- Export Functionality ---

@router.get("/export/pdf")
def export_wellness_report_pdf(
    days: int = Query(default=30, le=365), 
    db: Session = Depends(get_db)
):
    """Generate and download a professional PDF wellness report."""
    user_id = 1
    
    try:
        pdf_bytes = pdf_export_service.generate_wellness_report(db, user_id, days)
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=mindfulai_report_{days}days.pdf",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/export/csv")
def export_data_csv(db: Session = Depends(get_db)):
    """Export raw mood and journal data as CSV."""
    user_id = 1
    csv_data = analytics_service.get_csv_data(db, user_id=user_id)
    
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mindfulai_data_export.csv"}
    )