import cv2
from app.ml_models.transformer_loader import model_cache
from app.services.face_detector import face_detector

class FacialEmotionService:
    def predict(self, base64_image: str) -> dict | None:
        face_img = face_detector.extract_face(base64_image)
        if face_img is None:
            return None
            
        # Convert BGR to RGB for transformers
        rgb_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        pipeline = model_cache.load_facial_emotion()
        
        results = pipeline(rgb_img)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return {
            "emotion_label": results[0]['label'],
            "confidence": results[0]['score']
        }

facial_emotion_service = FacialEmotionService()