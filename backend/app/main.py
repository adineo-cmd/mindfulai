from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Import ALL route modules (Removed 'chat')
from app.api.routes import (
    auth,
    mood_logs,
    analytics,
    privacy,
    connectors,
    text_emotion,
    facial_emotion,
    pi_camera
)
from app.websocket import facial_stream, pi_camera as pi_camera_ws

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MindfulAI Backend", version="1.0.0")

# CORS Configuration - IMPORTANT!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4321",
        "http://127.0.0.1:4321",
        "http://0.0.0.0:4321"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include ALL routers (Removed 'chat')
app.include_router(auth.router)
app.include_router(mood_logs.router)
app.include_router(analytics.router)
app.include_router(privacy.router)
app.include_router(connectors.router)
app.include_router(text_emotion.router)
app.include_router(facial_emotion.router)
app.include_router(facial_stream.router)
app.include_router(pi_camera.router)
app.include_router(pi_camera_ws.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "ml_models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)