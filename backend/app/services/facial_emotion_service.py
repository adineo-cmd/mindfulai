import cv2
import base64
import numpy as np
from PIL import Image
from collections import deque
from app.ml_models.transformer_loader import model_cache
from app.services.face_detector import face_detector
from app.services.face_recognition_service import face_recognition_service  # ✅ NEW IMPORT

# ==========================================
# CONFIGURATION - Tune these for accuracy
# ==========================================
MIN_CONFIDENCE_THRESHOLD = 0.45  # Ignore predictions below 45% confidence
EMOTION_SMOOTHING = True        # Prevent rapid emotion flipping
CONFIDENCE_SMOOTHING_WINDOW = 5  # Average confidence over last 5 frames
MIN_FRAMES_TO_SWITCH = 3         # Require 3 consecutive frames to switch emotions

class FacialEmotionService:
    def __init__(self):
        self.last_emotion = None
        self.last_confidence = 0.0
        self.consecutive_count = 0
        self.confidence_history = deque(maxlen=CONFIDENCE_SMOOTHING_WINDOW)
        self.emotion_history = deque(maxlen=CONFIDENCE_SMOOTHING_WINDOW)
    
    def predict(self, base64_image: str, frontend_user_id: int = 1) -> dict | None:
        """
        Analyzes facial emotion and automatically identifies the user.
        
        Args:
            base64_image: Base64 encoded image string
            frontend_user_id: Fallback user ID if face recognition fails
            
        Returns:
            dict with emotion_label, confidence, and user_id
        """
        try:
            # ✅ Step 1: Decode base64 to numpy array
            if ',' in base64_image:
                base64_image_clean = base64_image.split(',')[1]
            else:
                base64_image_clean = base64_image
            
            image_bytes = base64.b64decode(base64_image_clean)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return None
            
            # ✅ Step 2: Detect and crop face
            face_img = face_detector.extract_face(img)
            
            if face_img is None:
                return None
            
            # ✅ Step 3: AUTOMATIC USER IDENTIFICATION (The Magic!)
            # Try to recognize who this person is
            identified_user_id = face_recognition_service.identify_user(face_img)
            
            if identified_user_id is None:
                # Face detected but not recognized. Use fallback or ignore.
                print(f"️ Unknown face detected. Using fallback user_id={frontend_user_id}")
                # Option 1: Use the frontend user_id as fallback
                identified_user_id = frontend_user_id
                # Option 2: Return None to skip processing unknown faces
                # return None
            
            print(f"✅ Recognized User ID: {identified_user_id}")
            
            # ✅ Step 4: Convert BGR to RGB for the transformer model
            rgb_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            
            # ✅ Step 5: Resize to 224x224 (required by ViT model)
            rgb_img = cv2.resize(rgb_img, (224, 224))
            
            # ✅ Step 6: Convert to PIL Image
            pil_image = Image.fromarray(rgb_img)
            
            # ✅ Step 7: Run emotion detection
            pipeline = model_cache.load_facial_emotion()
            results = pipeline(pil_image)
            
            if not results or len(results) == 0:
                return None
            
            # Sort by confidence (highest first)
            results.sort(key=lambda x: x['score'], reverse=True)
            
            top_emotion = results[0]['label']
            top_confidence = results[0]['score']
            
            # ✅ Step 8: Apply confidence threshold
            if top_confidence < MIN_CONFIDENCE_THRESHOLD:
                return None  # Too uncertain, ignore this frame
            
            # ✅ Step 9: Add to history for smoothing
            self.confidence_history.append(top_confidence)
            self.emotion_history.append(top_emotion)
            
            # ✅ Step 10: Calculate smoothed confidence (moving average)
            smoothed_confidence = sum(self.confidence_history) / len(self.confidence_history)
            
            # ✅ Step 11: Determine most common emotion in recent history
            if len(self.emotion_history) >= MIN_FRAMES_TO_SWITCH:
                # Count occurrences of each emotion in recent history
                emotion_counts = {}
                for emotion in self.emotion_history:
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                
                # Get the most frequent emotion
                most_common_emotion = max(emotion_counts, key=emotion_counts.get)
                most_common_count = emotion_counts[most_common_emotion]
                
                # Only switch if the new emotion appears in at least MIN_FRAMES_TO_SWITCH consecutive frames
                if most_common_count >= MIN_FRAMES_TO_SWITCH:
                    self.last_emotion = most_common_emotion
                    self.last_confidence = smoothed_confidence
                else:
                    # Keep previous emotion but update confidence
                    if self.last_emotion is not None:
                        self.last_confidence = smoothed_confidence
            else:
                # Not enough history yet, use current detection
                self.last_emotion = top_emotion
                self.last_confidence = smoothed_confidence
            
            # ✅ Step 12: Return emotion AND the identified user_id
            return {
                "emotion_label": self.last_emotion,
                "confidence": round(self.last_confidence, 2),
                "user_id": identified_user_id  # <--- CRITICAL: Auto-identified user
            }
            
        except Exception as e:
            print(f"❌ Facial emotion error: {type(e).__name__} - {e}")
            return None

# Singleton instance
facial_emotion_service = FacialEmotionService()