from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot_service import chatbot_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_id = 1  # Replace with actual user from JWT later
    
    try:
        # 1. Save user message
        user_message = ChatMessage(
            user_id=user_id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        
        # 2. Get context and generate response
        recent_emotions = ["neutral", "calm"]  # Mock for now
        result = chatbot_service.generate_response(request.message, recent_emotions)
        
        # 3. Save assistant message
        assistant_message = ChatMessage(
            user_id=user_id,
            role="assistant",
            content=result["response"],
            is_crisis=result["requires_human_support"]
        )
        db.add(assistant_message)
        
        # 4. Commit both at the same time (Atomic operation)
        db.commit()
        
        return ChatResponse(**result)
        
    except Exception as e:
        db.rollback() # Rollback if anything failed
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))