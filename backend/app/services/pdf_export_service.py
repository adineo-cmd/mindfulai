from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.colors import HexColor, black, red
from reportlab.lib.enums import TA_CENTER
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from io import BytesIO
import logging

# Import ALL your models
from app.models.mood_log import MoodLog
from app.models.text_emotion_record import TextEmotionRecord
from app.models.facial_emotion_record import FacialEmotionRecord

logger = logging.getLogger(__name__)

class PDFExportService:
    def generate_wellness_report(self, db: Session, user_id: int, days: int = 7) -> bytes:
        """Generate a professional PDF wellness report with REAL database data"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle', parent=styles['Heading1'], fontSize=24,
            textColor=HexColor('#2D5F4C'), spaceAfter=30, alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading', parent=styles['Heading2'], fontSize=14,
            textColor=HexColor('#1F2937'), spaceAfter=12, spaceBefore=12
        )
        
        story = []
        
        # --- Header ---
        story.append(Paragraph("MindfulAI Wellness Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # --- Fetch REAL Data from ALL Sources ---
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # 1. Query MoodLog (journal entries)
        mood_logs_count = db.query(func.count(MoodLog.id)).filter(
            MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date
        ).scalar() or 0
        
        mood_logs_avg = db.query(func.avg(MoodLog.mood_score)).filter(
            MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date
        ).scalar()
        
        # 2. Query FacialEmotionRecord (camera detections)
        facial_count = db.query(func.count(FacialEmotionRecord.id)).filter(
            FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date
        ).scalar() or 0
        
        facial_avg = db.query(func.avg(FacialEmotionRecord.confidence)).filter(
            FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date
        ).scalar()
        
        # 3. Query TextEmotionRecord (text analysis)
        text_count = db.query(func.count(TextEmotionRecord.id)).filter(
            TextEmotionRecord.user_id == user_id, TextEmotionRecord.created_at >= cutoff_date
        ).scalar() or 0
        
        # 4. Calculate TOTAL check-ins from ALL sources
        total_checkins = mood_logs_count + facial_count + text_count
        
        # 5. Calculate Average Mood (prioritize journal entries, fallback to facial)
        avg_mood = 0
        if mood_logs_avg:
            avg_mood = mood_logs_avg
        elif facial_avg:
            # Convert confidence (0-1) to mood scale (1-5)
            avg_mood = 1 + (facial_avg * 4)
        
        # 6. Get Most Common Emotion from BOTH sources
        text_emotion = db.query(TextEmotionRecord.emotion_label, func.count(TextEmotionRecord.id)).filter(
            TextEmotionRecord.user_id == user_id, TextEmotionRecord.created_at >= cutoff_date
        ).group_by(TextEmotionRecord.emotion_label).order_by(func.count(TextEmotionRecord.id).desc()).first()
        
        facial_emotion = db.query(FacialEmotionRecord.emotion_label, func.count(FacialEmotionRecord.id)).filter(
            FacialEmotionRecord.user_id == user_id, FacialEmotionRecord.created_at >= cutoff_date
        ).group_by(FacialEmotionRecord.emotion_label).order_by(func.count(FacialEmotionRecord.id).desc()).first()
        
        # Use the emotion with more occurrences
        emotion_label = "N/A"
        if text_emotion and facial_emotion:
            emotion_label = text_emotion[0].capitalize() if text_emotion[1] >= facial_emotion[1] else facial_emotion[0].capitalize()
        elif text_emotion:
            emotion_label = text_emotion[0].capitalize()
        elif facial_emotion:
            emotion_label = facial_emotion[0].capitalize()

        summary_data = [
            ['Average Mood', f"{avg_mood:.1f} / 5"],
            ['Total Check-ins', str(total_checkins)],
            ['Most Common Emotion', emotion_label],
            ['Report Period', f"Last {days} Days"]
        ]
        
        # --- Summary Table ---
        story.append(Paragraph("Summary Statistics", heading_style))
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#F9FAFB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E5E7EB'))
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.5*inch))
        
        # --- Data Breakdown Section ---
        story.append(Paragraph("Data Sources", heading_style))
        breakdown_data = [
            ['Journal Entries', str(mood_logs_count)],
            ['Camera Detections', str(facial_count)],
            ['Text Analysis', str(text_count)]
        ]
        breakdown_table = Table(breakdown_data, colWidths=[3*inch, 2*inch])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#F9FAFB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E5E7EB'))
        ]))
        story.append(breakdown_table)
        story.append(Spacer(1, 0.5*inch))
        
        # --- Recommendations ---
        story.append(Paragraph("Personalized Recommendations", heading_style))
        if total_checkins == 0:
            story.append(Paragraph("Start your wellness journey by:", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
            recommendations = [
                "• Writing your first journal entry",
                "• Using the Live Check camera feature",
                "• Analyzing your text emotions"
            ]
        else:
            recommendations = [
                "• Continue your daily journaling practice - it's helping you track patterns.",
                "• Consider adding 10 minutes of meditation to your morning routine.",
                "• Try to maintain your current sleep schedule (7-8 hours)."
            ]
        
        for rec in recommendations:
            story.append(Paragraph(rec, styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        
        # --- Footer / Disclaimer ---
        story.append(Spacer(1, 1*inch))
        disclaimer_style = ParagraphStyle(
            'Disclaimer', parent=styles['Normal'], fontSize=8,
            textColor=HexColor('#6B7280'), alignment=TA_CENTER
        )
        story.append(Paragraph("This report is for wellness tracking purposes only and is not a medical diagnosis.", disclaimer_style))
        story.append(Paragraph("If you're experiencing a mental health crisis, please contact a healthcare professional.", disclaimer_style))
        
        # Build PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes

pdf_export_service = PDFExportService()