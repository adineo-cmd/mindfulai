import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.mood_log import MoodLog
from app.services.analytics_service import analytics_service

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()

def test_mood_trends_aggregation(db_session):
    db_session.add(MoodLog(user_id=1, mood_score=4, note="Good day"))
    db_session.add(MoodLog(user_id=1, mood_score=2, note="Bad day"))
    db_session.commit()
    
    trends = analytics_service.get_mood_trends(db_session, user_id=1, days=7)
    assert len(trends) == 2
    assert trends[0]["mood"] == 2 # Oldest first due to reversed()