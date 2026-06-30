"""
Feedback API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.connection import get_db
from app.schemas.feedback import FeedbackResponse, DetailedFeedbackResponse, QuestionFeedback
from app.models.interview import Interview, InterviewStatus
from app.models.feedback import Feedback
from app.models.question import Question
from app.auth.jwt_handler import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/interview/{interview_id}", response_model=FeedbackResponse)
async def get_interview_feedback(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get feedback for a completed interview.
    
    Returns overall feedback including scores, strengths, weaknesses, and suggestions.
    """
    # Verify interview belongs to user
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.status != InterviewStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not completed yet"
        )
    
    feedback = db.query(Feedback).filter(
        Feedback.interview_id == interview_id
    ).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # Parse JSON fields
    return {
        "id": feedback.id,
        "interview_id": feedback.interview_id,
        "overall_score": feedback.overall_score,
        "technical_score": feedback.technical_score,
        "communication_score": feedback.communication_score,
        "problem_solving_score": feedback.problem_solving_score,
        "summary": feedback.summary,
        "overall_strengths": json.loads(feedback.overall_strengths) if feedback.overall_strengths else [],
        "overall_weaknesses": json.loads(feedback.overall_weaknesses) if feedback.overall_weaknesses else [],
        "improvement_suggestions": json.loads(feedback.improvement_suggestions) if feedback.improvement_suggestions else [],
        "recommended_resources": json.loads(feedback.recommended_resources) if feedback.recommended_resources else [],
        "performance_grade": feedback.performance_grade,
        "percentile_rank": feedback.percentile_rank,
        "created_at": feedback.created_at
    }


@router.get("/interview/{interview_id}/detailed")
async def get_detailed_feedback(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed feedback including per-question analysis.
    
    Returns comprehensive feedback with individual question evaluations.
    """
    # Verify interview belongs to user
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.status != InterviewStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not completed yet"
        )
    
    feedback = db.query(Feedback).filter(
        Feedback.interview_id == interview_id
    ).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # Get question-level feedback
    questions_feedback = []
    for question in interview.questions:
        if question.answer:
            questions_feedback.append({
                "question_number": question.question_number,
                "question_text": question.question_text,
                "answer_text": question.answer.answer_text,
                "score": question.answer.score,
                "feedback": question.answer.ai_feedback or "",
                "strengths": json.loads(question.answer.strengths) if question.answer.strengths else [],
                "weaknesses": json.loads(question.answer.weaknesses) if question.answer.weaknesses else []
            })
    
    return {
        "id": feedback.id,
        "interview_id": feedback.interview_id,
        "interview_title": interview.title,
        "interview_type": interview.interview_type,
        "total_questions": interview.total_questions,
        "overall_score": feedback.overall_score,
        "technical_score": feedback.technical_score,
        "communication_score": feedback.communication_score,
        "problem_solving_score": feedback.problem_solving_score,
        "summary": feedback.summary,
        "overall_strengths": json.loads(feedback.overall_strengths) if feedback.overall_strengths else [],
        "overall_weaknesses": json.loads(feedback.overall_weaknesses) if feedback.overall_weaknesses else [],
        "improvement_suggestions": json.loads(feedback.improvement_suggestions) if feedback.improvement_suggestions else [],
        "recommended_resources": json.loads(feedback.recommended_resources) if feedback.recommended_resources else [],
        "performance_grade": feedback.performance_grade,
        "percentile_rank": feedback.percentile_rank,
        "created_at": feedback.created_at,
        "questions_feedback": questions_feedback
    }


@router.get("/history", response_model=List[FeedbackResponse])
async def get_feedback_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get feedback history for all completed interviews.
    
    - **limit**: Maximum number of feedbacks to return (default 10)
    """
    feedbacks = db.query(Feedback).join(Interview).filter(
        Interview.user_id == current_user.id
    ).order_by(Feedback.created_at.desc()).limit(limit).all()
    
    results = []
    for feedback in feedbacks:
        results.append({
            "id": feedback.id,
            "interview_id": feedback.interview_id,
            "overall_score": feedback.overall_score,
            "technical_score": feedback.technical_score,
            "communication_score": feedback.communication_score,
            "problem_solving_score": feedback.problem_solving_score,
            "summary": feedback.summary,
            "overall_strengths": json.loads(feedback.overall_strengths) if feedback.overall_strengths else [],
            "overall_weaknesses": json.loads(feedback.overall_weaknesses) if feedback.overall_weaknesses else [],
            "improvement_suggestions": json.loads(feedback.improvement_suggestions) if feedback.improvement_suggestions else [],
            "recommended_resources": json.loads(feedback.recommended_resources) if feedback.recommended_resources else [],
            "performance_grade": feedback.performance_grade,
            "percentile_rank": feedback.percentile_rank,
            "created_at": feedback.created_at
        })
    
    return results


@router.get("/summary")
async def get_feedback_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a summary of all feedback data.
    
    Returns aggregated statistics across all interviews.
    """
    feedbacks = db.query(Feedback).join(Interview).filter(
        Interview.user_id == current_user.id
    ).all()
    
    if not feedbacks:
        return {
            "total_interviews": 0,
            "average_score": 0.0,
            "best_score": 0.0,
            "lowest_score": 0.0,
            "most_improved_area": None,
            "needs_improvement": [],
            "strengths_pattern": []
        }
    
    scores = [f.overall_score for f in feedbacks]
    
    # Aggregate strengths and weaknesses
    all_strengths = []
    all_weaknesses = []
    
    for feedback in feedbacks:
        if feedback.overall_strengths:
            all_strengths.extend(json.loads(feedback.overall_strengths))
        if feedback.overall_weaknesses:
            all_weaknesses.extend(json.loads(feedback.overall_weaknesses))
    
    # Find most common patterns
    from collections import Counter
    strength_counts = Counter(all_strengths)
    weakness_counts = Counter(all_weaknesses)
    
    return {
        "total_interviews": len(feedbacks),
        "average_score": round(sum(scores) / len(scores), 2),
        "best_score": max(scores),
        "lowest_score": min(scores),
        "most_improved_area": None,
        "needs_improvement": [w[0] for w in weakness_counts.most_common(3)],
        "strengths_pattern": [s[0] for s in strength_counts.most_common(3)]
    }
