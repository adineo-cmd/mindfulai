import time
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.facial_emotion_record import FacialEmotionRecord
from app.services.facial_emotion_service import facial_emotion_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/facial-emotion")
async def facial_emotion_ws(websocket: WebSocket):
    await websocket.accept()
    last_inference_time = 0
    user_id = 1 # In production, authenticate via query param or token
    
    try:
        while True:
            data = await websocket.receive_text()
            current_time = time.time()
            
            # Throttle to ~1 prediction per second
            if current_time - last_inference_time >= 1.0:
                result = facial_emotion_service.predict(data)
                
                if result:
                    # Save to DB (Privacy: ONLY label and timestamp, NO image data)
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
                    
                    await websocket.send_json({
                        "emotion": result["emotion_label"],
                        "confidence": round(result["confidence"], 2),
                        "timestamp": current_time
                    })
                else:
                    await websocket.send_json({"error": "No face detected"})
                    
                last_inference_time = current_time
            else:
                # Send a lightweight heartbeat/previous state if needed
                pass
                
    except WebSocketDisconnect:
        logger.info("Client disconnected from facial emotion stream")