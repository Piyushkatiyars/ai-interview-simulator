"""
Question Schemas - Pydantic Models for Request/Response Validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class QuestionBase(BaseModel):
    """Base question schema"""
    question_text: str = Field(..., min_length=10, max_length=2000)
    question_type: str = Field(default="open_ended")


class QuestionCreate(QuestionBase):
    """Schema for creating a question"""
    interview_id: int
    question_number: int
    expected_keywords: Optional[str] = None
    ideal_answer: Optional[str] = None
    max_score: int = Field(default=10, ge=1, le=10)


class QuestionResponse(BaseModel):
    """Schema for question response"""
    id: int
    interview_id: int
    question_number: int
    question_text: str
    question_type: str
    max_score: int
    is_answered: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionResponse):
    """Question response with answer included"""
    answer: Optional["AnswerResponse"] = None
    
    class Config:
        from_attributes = True


class NextQuestionResponse(BaseModel):
    """Response for getting next question"""
    question: Optional[QuestionResponse] = None
    current_question_number: int
    total_questions: int
    is_last_question: bool
    progress_percentage: float


# Forward reference
from app.schemas.answer import AnswerResponse
QuestionWithAnswer.model_rebuild()
