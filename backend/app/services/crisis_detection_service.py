import re

# Keywords that indicate a potential mental health crisis
CRISIS_KEYWORDS = [
    r"\bsuicide\b", r"\bkill myself\b", r"\bend it all\b", 
    r"\bhurt myself\b", r"\bgive up\b", r"\bno reason to live\b",
    r"\bself[- ]harm\b", r"\bwant to die\b"
]

class CrisisDetectionService:
    def is_crisis(self, text: str) -> bool:
        """Checks if the text contains crisis-related keywords."""
        text_lower = text.lower()
        for pattern in CRISIS_KEYWORDS:
            if re.search(pattern, text_lower):
                return True
        return False

# Create a singleton instance to be imported by other services
crisis_detection_service = CrisisDetectionService()