from pydantic import BaseModel, Field
from typing import Optional

class ConnectorConnectRequest(BaseModel):
    """Schema for connecting a new external data source"""
    source_type: str = Field(..., description="Type of connector (e.g., 'notion', 'google_keep', 'email')")
    auth_code: Optional[str] = Field(None, description="OAuth code or API key for the external service")

class ConnectorSyncRequest(BaseModel):
    """Schema for syncing data from a connected source"""
    source_id: int = Field(..., description="The ID of the connected source to sync")