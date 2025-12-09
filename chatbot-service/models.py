import datetime
from sqlalchemy import Column, String, Text, DateTime, text
from database import Base # Import dari file database.py yang baru kita buat

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True, server_default=text("uuid_generate_v4()"))
    user_id = Column(String)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)