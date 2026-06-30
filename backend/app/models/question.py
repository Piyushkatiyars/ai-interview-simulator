"""
Question Model - SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Question(Base):
    """Question model for interview questions"""
    
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    
    # Question content
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="open_ended")  # open_ended, multiple_choice, coding
    
    # Expected answer guidelines (for AI evaluation)
    expected_keywords = Column(Text, nullable=True)  # JSON string of keywords
    ideal_answer = Column(Text, nullable=True)
    max_score = Column(Integer, default=10)
    
    # Status
    is_answered = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Question(id={self.id}, number={self.question_number})>"
    
    def to_dict(self):
        """Convert question to dictionary"""
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "question_number": self.question_number,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "max_score": self.max_score,
            "is_answered": self.is_answered,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
