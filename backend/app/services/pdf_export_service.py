from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.colors import HexColor, black
from reportlab.lib.enums import TA_CENTER
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from io import BytesIO

# Import your models to query real data
from app.models.mood_log import MoodLog
from app.models.text_emotion_record import TextEmotionRecord

class PDFExportService:
    def generate_wellness_report(self, db: Session, user_id: int, days: int = 30) -> bytes:
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
        
        # --- Fetch REAL Data from Database ---
        cutoff_date = datetime.now() - timedelta(days=days)
        
        avg_mood = db.query(func.avg(MoodLog.mood_score)).filter(
            MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date
        ).scalar() or 0
        
        total_checkins = db.query(func.count(MoodLog.id)).filter(
            MoodLog.user_id == user_id, MoodLog.created_at >= cutoff_date
        ).scalar() or 0
        
        most_common = db.query(TextEmotionRecord.emotion_label, func.count(TextEmotionRecord.id)).filter(
            TextEmotionRecord.user_id == user_id, TextEmotionRecord.created_at >= cutoff_date
        ).group_by(TextEmotionRecord.emotion_label).order_by(func.count(TextEmotionRecord.id).desc()).first()

        summary_data = [
            ['Average Mood', f"{avg_mood:.1f} / 5"],
            ['Total Check-ins', str(total_checkins)],
            ['Most Common Emotion', most_common[0].capitalize() if most_common else "N/A"],
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
        
        # --- Recommendations ---
        story.append(Paragraph("Personalized Recommendations", heading_style))
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