from pydantic import BaseModel

class ConsentUpdate(BaseModel):
    camera_consent: bool | None = None
    text_consent: bool | None = None
    analytics_consent: bool | None = None