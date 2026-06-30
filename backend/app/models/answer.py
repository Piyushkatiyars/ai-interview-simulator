"""
Answer Model - SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Answer(Base):
    """Answer model for storing user responses"""
    
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Answer content
    answer_text = Column(Text, nullable=False)
    
    # AI Evaluation results
    score = Column(Float, default=0.0)  # Score out of 10
    ai_feedback = Column(Text, nullable=True)  # Detailed feedback from AI
    strengths = Column(Text, nullable=True)  # JSON array of strengths
    weaknesses = Column(Text, nullable=True)  # JSON array of weaknesses
    suggestions = Column(Text, nullable=True)  # JSON array of improvement suggestions
    
    # Evaluation metadata
    confidence_score = Column(Float, nullable=True)  # AI confidence in evaluation
    keywords_matched = Column(Text, nullable=True)  # Keywords found in answer
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    evaluated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    question = relationship("Question", back_populates="answer")
    
    def __repr__(self):
        return f"<Answer(id={self.id}, question_id={self.question_id}, score={self.score})>"
    
    def to_dict(self):
        """Convert answer to dictionary"""
        import json
        return {
            "id": self.id,
            "question_id": self.question_id,
            "answer_text": self.answer_text,
            "score": self.score,
            "ai_feedback": self.ai_feedback,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "suggestions": json.loads(self.suggestions) if self.suggestions else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "evaluated_at": self.evaluated_at.isoformat() if self.evaluated_at else None
        }
