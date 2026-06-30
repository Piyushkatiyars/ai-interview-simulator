"""
Answer Schemas - Pydantic Models for Request/Response Validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class AnswerCreate(BaseModel):
    """Schema for submitting an answer"""
    question_id: int
    answer_text: str = Field(..., min_length=10, max_length=5000)
    
    @validator('answer_text')
    def validate_answer(cls, v):
        """Validate and sanitize answer text"""
        return v.strip()


class AnswerResponse(BaseModel):
    """Schema for answer response"""
    id: int
    question_id: int
    answer_text: str
    score: float
    ai_feedback: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    suggestions: List[str] = []
    created_at: datetime
    evaluated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AnswerEvaluation(BaseModel):
    """Schema for AI evaluation result"""
    score: float = Field(..., ge=0, le=10)
    feedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    keywords_matched: List[str] = []
    confidence_score: float = Field(default=0.85, ge=0, le=1)


class SubmitAnswerResponse(BaseModel):
    """Response after submitting an answer"""
    answer: AnswerResponse
    evaluation: AnswerEvaluation
    next_question: Optional["QuestionResponse"] = None
    is_interview_complete: bool
    questions_remaining: int


# Forward reference
from app.schemas.question import QuestionResponse
SubmitAnswerResponse.model_rebuild()
