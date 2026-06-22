import cv2
import numpy as np
import base64

class FaceDetector:
    def __init__(self):
        # Using OpenCV's pre-trained Haar Cascade for speed
        self.cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    def extract_face(self, base64_image: str) -> np.ndarray | None:
        try:
            # Remove data URL prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            image_bytes = base64.b64decode(base64_image)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = self.cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) > 0:
                (x, y, w, h) = faces[0]
                return img[y:y+h, x:x+w]
            return None
        except Exception:
            return None

face_detector = FaceDetector()