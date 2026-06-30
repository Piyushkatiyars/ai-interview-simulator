"""
Interview Model - SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum


class InterviewType(str, enum.Enum):
    """Enum for interview types"""
    HR = "hr"
    PYTHON = "python"
    WEB_DEVELOPMENT = "web_development"
    CLOUD_COMPUTING = "cloud_computing"


class InterviewStatus(str, enum.Enum):
    """Enum for interview status"""
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DifficultyLevel(str, enum.Enum):
    """Enum for difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Interview(Base):
    """Interview model for managing interview sessions"""
    
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Interview details
    title = Column(String(255), nullable=False)
    interview_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), default=DifficultyLevel.INTERMEDIATE.value)
    status = Column(String(50), default=InterviewStatus.CREATED.value)
    
    # Scoring
    total_questions = Column(Integer, default=5)
    answered_questions = Column(Integer, default=0)
    total_score = Column(Float, default=0.0)
    average_score = Column(Float, default=0.0)
    
    # Additional info
    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Interview(id={self.id}, type={self.interview_type}, status={self.status})>"
    
    def to_dict(self):
        """Convert interview to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "interview_type": self.interview_type,
            "difficulty": self.difficulty,
            "status": self.status,
            "total_questions": self.total_questions,
            "answered_questions": self.answered_questions,
            "total_score": self.total_score,
            "average_score": self.average_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }
