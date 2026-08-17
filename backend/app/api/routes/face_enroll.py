from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import os
import shutil
from app.services.face_recognition_service import face_recognition_service

router = APIRouter(prefix="/api/face", tags=["face-recognition"])

REFERENCE_DIR = "backend/reference_images"

@router.post("/enroll")
async def enroll_face(
    file: UploadFile = File(...), 
    user_id: int = Query(..., description="The User ID to assign this face to")
):
    """Upload a clear photo of a user to enroll them in the system."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save file as user_X.jpg
    filename = f"user_{user_id}.jpg"
    file_path = os.path.join(REFERENCE_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Reload the recognition service to include the new face
        face_recognition_service.load_known_faces()
        
        return {"status": "success", "message": f"Face enrolled for User {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")