import cv2
import numpy as np
import base64
import logging

logger = logging.getLogger(__name__)

class FaceDetector:
    def __init__(self):
        """
        Initialize Face Detector with Haar Cascade.
        Now accepts BOTH base64 strings AND numpy arrays as input.
        """
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.cascade.empty():
            logger.error("Failed to load Haar Cascade classifier!")
            raise RuntimeError("Haar Cascade classifier not loaded properly")
        
        logger.info("✅ Face detector initialized successfully")

    def extract_face(self, image_input) -> np.ndarray | None:
        """
        Extract face from an image.
        
        Args:
            image_input: Can be EITHER:
                - A base64 string (with or without data URI prefix)
                - A numpy array (already decoded BGR image from OpenCV)
            
        Returns:
            Cropped face image as numpy array (BGR), or None if no face detected
        """
        try:
            # ✅ FIX: Handle both base64 strings AND numpy arrays
            if isinstance(image_input, np.ndarray):
                # Input is already a decoded image (numpy array)
                img = image_input
            elif isinstance(image_input, str):
                # Input is a base64 string - decode it
                if ',' in image_input:
                    image_input = image_input.split(',')[1]
                
                if not image_input or len(image_input) < 100:
                    logger.warning("Invalid or too short base64 image received")
                    return None
                
                image_bytes = base64.b64decode(image_input)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                logger.error(f"Unsupported input type: {type(image_input)}")
                return None
            
            # Validate image
            if img is None:
                logger.warning("Failed to decode image")
                return None
            
            if len(img.shape) < 2 or img.shape[0] < 30 or img.shape[1] < 30:
                logger.warning(f"Image too small: {img.shape}")
                return None
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply histogram equalization for better detection in low light
            gray = cv2.equalizeHist(gray)
            
            # Detect faces
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,  # Slightly lower for better detection
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # Return the largest detected face
            if len(faces) > 0:
                # Sort by area to get the largest face
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                (x, y, w, h) = faces[0]
                
                # Add 15% padding around face for better emotion detection
                padding = int(min(w, h) * 0.15)
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(img.shape[1], x + w + padding)
                y2 = min(img.shape[0], y + h + padding)
                
                face_crop = img[y1:y2, x1:x2]
                
                if face_crop.size > 0:
                    logger.debug(f"✅ Face detected: {face_crop.shape}")
                    return face_crop
            
            logger.debug("⚠️ No face detected in frame")
            return None
            
        except base64.binascii.Error as e:
            logger.error(f"Base64 decoding error: {e}")
            return None
        except cv2.error as e:
            logger.error(f"OpenCV error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in face detection: {type(e).__name__} - {e}")
            return None

# Singleton instance
face_detector = FaceDetector()