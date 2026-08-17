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
    # ✅ Extract user_id from the WebSocket query parameters as a FALLBACK
    fallback_user_id = int(websocket.query_params.get("user_id", 1))
    
    await websocket.accept()
    last_inference_time = 0
    
    logger.info(f"✅ Client connected to facial emotion stream (Fallback User ID: {fallback_user_id})")
    
    try:
        while True:
            data = await websocket.receive_text()
            current_time = time.time()
            
            # Throttle to ~1 prediction per second
            if current_time - last_inference_time >= 1.0:
                
                # ✅ Pass the fallback user_id to the service in case face recognition fails
                result = facial_emotion_service.predict(data, frontend_user_id=fallback_user_id)
                
                if result:
                    # ✅ CRITICAL: Use the biometrically identified user_id! 
                    # Falls back to the query param user_id only if the face was unknown.
                    actual_user_id = result.get("user_id", fallback_user_id)
                    
                    # Save to DB (Privacy: ONLY label and timestamp, NO image data)
                    db = SessionLocal()
                    try:
                        record = FacialEmotionRecord(
                            user_id=actual_user_id, # <--- Saves to the AI-identified user!
                            emotion_label=result["emotion_label"],
                            confidence=result["confidence"]
                        )
                        db.add(record)
                        db.commit()
                    finally:
                        db.close()
                    
                    # ✅ Send the identified user back to frontend (Great for UX: "Recognized: Aditya")
                    await websocket.send_json({
                        "emotion": result["emotion_label"],
                        "confidence": round(result["confidence"], 2),
                        "timestamp": current_time,
                        "identified_user": actual_user_id 
                    })
                else:
                    # No face detected or processing error
                    await websocket.send_json({
                        "emotion": "No face detected",
                        "confidence": 0.0,
                        "timestamp": current_time
                    })
                    
                last_inference_time = current_time
            else:
                # Send a lightweight heartbeat/previous state if needed
                pass
                
    except WebSocketDisconnect:
        logger.info(f"🔌 Client disconnected from facial emotion stream")