"""
Feedback Model - SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Feedback(Base):
    """Feedback model for overall interview evaluation"""
    
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Overall scores
    overall_score = Column(Float, default=0.0)  # Average of all question scores
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)
    
    # Detailed feedback
    summary = Column(Text, nullable=True)  # Overall summary of performance
    overall_strengths = Column(Text, nullable=True)  # JSON array
    overall_weaknesses = Column(Text, nullable=True)  # JSON array
    improvement_suggestions = Column(Text, nullable=True)  # JSON array
    recommended_resources = Column(Text, nullable=True)  # JSON array of learning resources
    
    # Performance metrics
    performance_grade = Column(String(2), nullable=True)  # A+, A, B+, B, C+, C, D, F
    percentile_rank = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="feedback")
    
    def __repr__(self):
        return f"<Feedback(id={self.id}, interview_id={self.interview_id}, score={self.overall_score})>"
    
    def calculate_grade(self) -> str:
        """Calculate grade based on overall score"""
        score = self.overall_score
        if score >= 9.5:
            return "A+"
        elif score >= 9.0:
            return "A"
        elif score >= 8.5:
            return "B+"
        elif score >= 8.0:
            return "B"
        elif score >= 7.5:
            return "C+"
        elif score >= 7.0:
            return "C"
        elif score >= 6.0:
            return "D"
        else:
            return "F"
    
    def to_dict(self):
        """Convert feedback to dictionary"""
        import json
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "overall_score": self.overall_score,
            "technical_score": self.technical_score,
            "communication_score": self.communication_score,
            "problem_solving_score": self.problem_solving_score,
            "summary": self.summary,
            "overall_strengths": json.loads(self.overall_strengths) if self.overall_strengths else [],
            "overall_weaknesses": json.loads(self.overall_weaknesses) if self.overall_weaknesses else [],
            "improvement_suggestions": json.loads(self.improvement_suggestions) if self.improvement_suggestions else [],
            "recommended_resources": json.loads(self.recommended_resources) if self.recommended_resources else [],
            "performance_grade": self.performance_grade,
            "percentile_rank": self.percentile_rank,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
