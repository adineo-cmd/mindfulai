import time
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.facial_emotion_record import FacialEmotionRecord
from app.services.facial_emotion_service import facial_emotion_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/pi-camera")
async def pi_camera_ws(websocket: WebSocket):
    """
    WebSocket endpoint for Raspberry Pi external camera.
    The Pi sends base64 frames, backend processes them and returns emotion analysis.
    """
    await websocket.accept()
    last_inference_time = 0
    user_id = 1  # Replace with actual user from JWT
    
    logger.info("✅ Raspberry Pi camera connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            current_time = time.time()
            
            # Throttle to ~1 prediction per second
            if current_time - last_inference_time >= 1.0:
                result = facial_emotion_service.predict(data)
                
                if result:
                    # Save to database
                    db = SessionLocal()
                    try:
                        record = FacialEmotionRecord(
                            user_id=user_id,
                            emotion_label=result["emotion_label"],
                            confidence=result["confidence"]
                        )
                        db.add(record)
                        db.commit()
                    finally:
                        db.close()
                    
                    # Send result back to Pi
                    await websocket.send_json({
                        "emotion": result["emotion_label"],
                        "confidence": round(result["confidence"], 2),
                        "timestamp": current_time
                    })
                else:
                    await websocket.send_json({
                        "emotion": "No face detected",
                        "confidence": 0.0,
                        "timestamp": current_time
                    })
                
                last_inference_time = current_time
                
    except WebSocketDisconnect:
        logger.info("🔌 Raspberry Pi camera disconnected")