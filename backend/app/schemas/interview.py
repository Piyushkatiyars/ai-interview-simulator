"""
Interview Schemas - Pydantic Models for Request/Response Validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class InterviewTypeEnum(str, Enum):
    """Interview type enumeration"""
    HR = "hr"
    PYTHON = "python"
    WEB_DEVELOPMENT = "web_development"
    CLOUD_COMPUTING = "cloud_computing"


class DifficultyEnum(str, Enum):
    """Difficulty level enumeration"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class InterviewStatusEnum(str, Enum):
    """Interview status enumeration"""
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewCreate(BaseModel):
    """Schema for creating a new interview"""
    title: str = Field(..., min_length=3, max_length=255)
    interview_type: InterviewTypeEnum
    difficulty: DifficultyEnum = DifficultyEnum.INTERMEDIATE
    total_questions: int = Field(default=5, ge=1, le=20)
    notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('title')
    def validate_title(cls, v):
        """Sanitize title"""
        return v.strip()


class InterviewUpdate(BaseModel):
    """Schema for updating an interview"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[InterviewStatusEnum] = None


class InterviewResponse(BaseModel):
    """Schema for interview response"""
    id: int
    user_id: int
    title: str
    interview_type: str
    difficulty: str
    status: str
    total_questions: int
    answered_questions: int
    total_score: float
    average_score: float
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    """Schema for list of interviews"""
    interviews: List[InterviewResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class InterviewWithQuestions(InterviewResponse):
    """Interview response with questions included"""
    questions: List["QuestionResponse"] = []
    
    class Config:
        from_attributes = True


class StartInterviewResponse(BaseModel):
    """Response when starting an interview"""
    interview_id: int
    status: str
    first_question: Optional["QuestionResponse"] = None
    total_questions: int
    message: str


# Forward reference for QuestionResponse
from app.schemas.question import QuestionResponse
InterviewWithQuestions.model_rebuild()
StartInterviewResponse.model_rebuild()
