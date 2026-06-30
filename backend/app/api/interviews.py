"""
Interview API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.schemas.interview import (
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewListResponse, InterviewWithQuestions, StartInterviewResponse
)
from app.schemas.question import QuestionResponse, NextQuestionResponse
from app.schemas.answer import AnswerCreate, SubmitAnswerResponse
from app.services.interview_service import InterviewService
from app.auth.jwt_handler import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new interview session.
    
    - **title**: Interview title (required)
    - **interview_type**: Type of interview - hr, python, web_development, cloud_computing
    - **difficulty**: beginner, intermediate, or advanced
    - **total_questions**: Number of questions (1-20, default 5)
    - **notes**: Optional notes
    
    Questions will be automatically generated based on the interview type and difficulty.
    """
    service = InterviewService(db)
    interview = service.create_interview(current_user.id, interview_data)
    return interview


@router.get("/", response_model=InterviewListResponse)
async def list_interviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    status: Optional[str] = None,
    interview_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of user's interviews.
    
    - **page**: Page number (default 1)
    - **per_page**: Items per page (default 10, max 50)
    - **status**: Filter by status (created, in_progress, completed, cancelled)
    - **interview_type**: Filter by type
    """
    service = InterviewService(db)
    result = service.get_user_interviews(
        current_user.id,
        page=page,
        per_page=per_page,
        status_filter=status,
        type_filter=interview_type
    )
    return result


@router.get("/{interview_id}", response_model=InterviewWithQuestions)
async def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get interview details with questions.
    
    Returns the interview along with all its questions.
    """
    service = InterviewService(db)
    interview = service.get_interview(interview_id, current_user.id)
    return interview


@router.post("/{interview_id}/start", response_model=StartInterviewResponse)
async def start_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start an interview session.
    
    Changes interview status to 'in_progress' and returns the first question.
    """
    service = InterviewService(db)
    result = service.start_interview(interview_id, current_user.id)
    return result


@router.get("/{interview_id}/next-question", response_model=NextQuestionResponse)
async def get_next_question(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the next unanswered question in the interview.
    
    Returns question details and progress information.
    """
    service = InterviewService(db)
    result = service.get_next_question(interview_id, current_user.id)
    return result


@router.post("/submit-answer")
async def submit_answer(
    answer_data: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer for evaluation.
    
    - **question_id**: ID of the question being answered
    - **answer_text**: User's answer (min 10 chars)
    
    The answer will be evaluated by AI and scored out of 10.
    Returns the evaluation with strengths, weaknesses, and suggestions.
    """
    service = InterviewService(db)
    result = service.submit_answer(current_user.id, answer_data)
    
    # Convert SQLAlchemy objects to dicts for JSON serialization
    return {
        "answer": {
            "id": result["answer"].id,
            "question_id": result["answer"].question_id,
            "answer_text": result["answer"].answer_text,
            "score": result["answer"].score,
            "ai_feedback": result["answer"].ai_feedback,
            "created_at": result["answer"].created_at.isoformat() if result["answer"].created_at else None
        },
        "evaluation": result["evaluation"],
        "next_question": {
            "id": result["next_question"].id,
            "question_number": result["next_question"].question_number,
            "question_text": result["next_question"].question_text,
            "max_score": result["next_question"].max_score
        } if result["next_question"] else None,
        "is_interview_complete": result["is_interview_complete"],
        "questions_remaining": result["questions_remaining"]
    }


@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    interview_data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update interview details.
    
    - **title**: Updated title
    - **notes**: Updated notes
    - **status**: Updated status (use with caution)
    """
    service = InterviewService(db)
    interview = service.get_interview(interview_id, current_user.id)
    
    update_data = interview_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(interview, field, value if not hasattr(value, 'value') else value.value)
    
    db.commit()
    db.refresh(interview)
    return interview


@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an interview and all associated data.
    
    Warning: This action is irreversible.
    """
    service = InterviewService(db)
    service.delete_interview(interview_id, current_user.id)
    return {"message": "Interview deleted successfully"}
