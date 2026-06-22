# FIX: Import from langchain_community instead of langchain
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from app.services.crisis_detection_service import crisis_detection_service

class ChatbotService:
    def __init__(self):
        # Use tinyllama since that's what you have installed
        self.llm = Ollama(
            model="tinyllama",
            base_url="http://localhost:11434"
        )
        
        self.prompt_template = PromptTemplate(
            input_variables=["message", "recent_emotions"],
            template="""You are a compassionate mental wellness companion.
Recent emotions: {recent_emotions}.
User says: '{message}'
Respond warmly in 1-2 sentences. Be supportive and ask a gentle follow-up question."""
        )
    
    def generate_response(self, message: str, recent_emotions: list[str]) -> dict:
        is_crisis = crisis_detection_service.is_crisis(message)
        
        if is_crisis:
            return {
                "response": "I hear that you're in a lot of pain. Please know you're not alone, and there is support available right now.",
                "requires_human_support": True,
                "crisis_resources": {
                    "hotline": "988 Suicide & Crisis Lifeline",
                    "text_line": "Text HOME to 741741"
                }
            }

        try:
            prompt = self.prompt_template.format(
                message=message,
                recent_emotions=", ".join(recent_emotions[-3:]) if recent_emotions else "neutral"
            )
            response = self.llm(prompt)
            
            return {
                "response": response.strip(),
                "requires_human_support": False,
                "crisis_resources": None
            }
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "response": "Thank you for sharing. I'm here to listen. Would you like to explore some grounding exercises or talk more about what's on your mind?",
                "requires_human_support": False,
                "crisis_resources": None
            }

chatbot_service = ChatbotService()