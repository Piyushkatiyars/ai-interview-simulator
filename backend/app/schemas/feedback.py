"""
Feedback Schemas - Pydantic Models for Request/Response Validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""
    interview_id: int
    overall_score: float = Field(..., ge=0, le=10)
    technical_score: Optional[float] = Field(None, ge=0, le=10)
    communication_score: Optional[float] = Field(None, ge=0, le=10)
    problem_solving_score: Optional[float] = Field(None, ge=0, le=10)
    summary: Optional[str] = None
    overall_strengths: List[str] = []
    overall_weaknesses: List[str] = []
    improvement_suggestions: List[str] = []
    recommended_resources: List[str] = []


class FeedbackResponse(BaseModel):
    """Schema for feedback response"""
    id: int
    interview_id: int
    overall_score: float
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    problem_solving_score: Optional[float] = None
    summary: Optional[str] = None
    overall_strengths: List[str] = []
    overall_weaknesses: List[str] = []
    improvement_suggestions: List[str] = []
    recommended_resources: List[str] = []
    performance_grade: Optional[str] = None
    percentile_rank: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DetailedFeedbackResponse(FeedbackResponse):
    """Detailed feedback with interview info"""
    interview_title: str
    interview_type: str
    total_questions: int
    questions_feedback: List["QuestionFeedback"] = []


class QuestionFeedback(BaseModel):
    """Individual question feedback"""
    question_number: int
    question_text: str
    answer_text: str
    score: float
    feedback: str
    strengths: List[str]
    weaknesses: List[str]


class FeedbackSummary(BaseModel):
    """Summary of all feedbacks for analytics"""
    total_interviews: int
    average_score: float
    best_score: float
    lowest_score: float
    most_improved_area: Optional[str] = None
    needs_improvement: List[str] = []
    strengths_pattern: List[str] = []
