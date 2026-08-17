import os
import logging
import numpy as np
from deepface import DeepFace

logger = logging.getLogger(__name__)

# Folder to store reference images (Create this folder manually)
REFERENCE_DIR = "backend/reference_images"
os.makedirs(REFERENCE_DIR, exist_ok=True)

class FaceRecognitionService:
    def __init__(self):
        self.known_embeddings = {}  # {user_id: embedding_array}
        self.model_name = "Facenet"  # Highly accurate model built into DeepFace
        self.load_known_faces()

    def load_known_faces(self):
        """Load all reference images and compute their embeddings."""
        self.known_embeddings = {}
        
        if not os.path.exists(REFERENCE_DIR):
            logger.warning(f"Reference directory {REFERENCE_DIR} does not exist")
            return

        for filename in os.listdir(REFERENCE_DIR):
            if filename.endswith(('.jpg', '.jpeg', '.png')):
                try:
                    # Filename format MUST be: user_1.jpg, user_2.jpg, etc.
                    user_id = int(filename.split('_')[1].split('.')[0])
                    image_path = os.path.join(REFERENCE_DIR, filename)
                    
                    # Get embedding using DeepFace
                    # enforce_detection=False helps since we already cropped the face
                    embedding_obj = DeepFace.represent(
                        img_path=image_path, 
                        model_name=self.model_name,
                        enforce_detection=False
                    )
                    
                    if embedding_obj and len(embedding_obj) > 0:
                        self.known_embeddings[user_id] = np.array(embedding_obj[0]["embedding"])
                        logger.info(f"✅ Loaded reference face for User ID: {user_id}")
                    else:
                        logger.warning(f"No face embedding found in {filename}")
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
        
        if not self.known_embeddings:
            logger.warning("⚠️ No reference faces loaded. Face recognition will fallback to default user.")

    def identify_user(self, face_image_np) -> int | None:
        """
        Compare an incoming face (numpy array) against known embeddings.
        Returns user_id if matched, None if unknown.
        """
        if not self.known_embeddings:
            return None

        try:
            # DeepFace can take a numpy array directly!
            embedding_obj = DeepFace.represent(
                img_path=face_image_np, 
                model_name=self.model_name,
                enforce_detection=False 
            )
            
            if not embedding_obj or len(embedding_obj) == 0:
                return None
                
            incoming_embedding = np.array(embedding_obj[0]["embedding"])
            
            # Calculate cosine similarity with all known faces
            best_match_user_id = None
            max_similarity = -1.0
            
            for user_id, known_embedding in self.known_embeddings.items():
                # Cosine similarity formula
                similarity = np.dot(incoming_embedding, known_embedding) / (
                    np.linalg.norm(incoming_embedding) * np.linalg.norm(known_embedding)
                )
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    best_match_user_id = user_id
            
            # Threshold for Facenet is typically around 0.85 - 0.90
            if max_similarity >= 0.85:
                logger.info(f"✅ Recognized User ID: {best_match_user_id} (Similarity: {max_similarity:.2f})")
                return best_match_user_id
            else:
                logger.info(f"⚠️ Unknown face (Max similarity: {max_similarity:.2f})")
                return None
                
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return None

# Singleton instance
face_recognition_service = FaceRecognitionService()