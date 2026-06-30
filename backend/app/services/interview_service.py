"""
Interview Service - Business Logic for Interview Operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from datetime import datetime
from typing import List, Optional

from app.models.interview import Interview, InterviewStatus
from app.models.question import Question
from app.models.answer import Answer
from app.models.feedback import Feedback
from app.schemas.interview import InterviewCreate, InterviewUpdate
from app.schemas.answer import AnswerCreate
from app.services.ai_service import AIService


class InterviewService:
    """Service class for interview-related operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()
    
    def create_interview(self, user_id: int, interview_data: InterviewCreate) -> Interview:
        """
        Create a new interview session.
        
        Args:
            user_id: ID of the user creating the interview
            interview_data: Interview creation data
            
        Returns:
            Created Interview object
        """
        # Create interview
        interview = Interview(
            user_id=user_id,
            title=interview_data.title,
            interview_type=interview_data.interview_type.value,
            difficulty=interview_data.difficulty.value,
            total_questions=interview_data.total_questions,
            notes=interview_data.notes,
            status=InterviewStatus.CREATED.value
        )
        
        self.db.add(interview)
        self.db.commit()
        self.db.refresh(interview)
        
        # Generate questions using AI
        questions = self.ai_service.generate_questions(
            interview_type=interview_data.interview_type.value,
            difficulty=interview_data.difficulty.value,
            count=interview_data.total_questions
        )
        
        # Save questions to database
        for i, q_data in enumerate(questions, 1):
            question = Question(
                interview_id=interview.id,
                question_number=i,
                question_text=q_data["question"],
                question_type=q_data.get("type", "open_ended"),
                expected_keywords=q_data.get("keywords", ""),
                ideal_answer=q_data.get("ideal_answer", ""),
                max_score=10
            )
            self.db.add(question)
        
        self.db.commit()
        self.db.refresh(interview)
        
        return interview
    
    def get_interview(self, interview_id: int, user_id: int) -> Interview:
        """
        Get interview by ID.
        
        Args:
            interview_id: ID of the interview
            user_id: ID of the user (for authorization)
            
        Returns:
            Interview object
            
        Raises:
            HTTPException: If interview not found or unauthorized
        """
        interview = self.db.query(Interview).filter(
            Interview.id == interview_id,
            Interview.user_id == user_id
        ).first()
        
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )
        
        return interview
    
    def get_user_interviews(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 10,
        status_filter: Optional[str] = None,
        type_filter: Optional[str] = None
    ) -> dict:
        """
        Get paginated list of user's interviews.
        
        Args:
            user_id: ID of the user
            page: Page number
            per_page: Items per page
            status_filter: Optional status filter
            type_filter: Optional interview type filter
            
        Returns:
            Dictionary with interviews and pagination info
        """
        query = self.db.query(Interview).filter(Interview.user_id == user_id)
        
        if status_filter:
            query = query.filter(Interview.status == status_filter)
        
        if type_filter:
            query = query.filter(Interview.interview_type == type_filter)
        
        total = query.count()
        
        interviews = query.order_by(desc(Interview.created_at))\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()
        
        return {
            "interviews": interviews,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    
    def start_interview(self, interview_id: int, user_id: int) -> dict:
        """
        Start an interview session.
        
        Args:
            interview_id: ID of the interview
            user_id: ID of the user
            
        Returns:
            Dictionary with interview info and first question
        """
        interview = self.get_interview(interview_id, user_id)
        
        if interview.status not in [InterviewStatus.CREATED.value, InterviewStatus.IN_PROGRESS.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot start interview with status: {interview.status}"
            )
        
        interview.status = InterviewStatus.IN_PROGRESS.value
        interview.started_at = datetime.utcnow()
        self.db.commit()
        
        # Get first unanswered question
        first_question = self.db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.is_answered == False
        ).order_by(Question.question_number).first()
        
        return {
            "interview_id": interview.id,
            "status": interview.status,
            "first_question": first_question,
            "total_questions": interview.total_questions,
            "message": "Interview started successfully"
        }
    
    def get_next_question(self, interview_id: int, user_id: int) -> dict:
        """
        Get the next unanswered question.
        
        Args:
            interview_id: ID of the interview
            user_id: ID of the user
            
        Returns:
            Dictionary with question info
        """
        interview = self.get_interview(interview_id, user_id)
        
        next_question = self.db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.is_answered == False
        ).order_by(Question.question_number).first()
        
        answered_count = self.db.query(Question).filter(
            Question.interview_id == interview_id,
            Question.is_answered == True
        ).count()
        
        return {
            "question": next_question,
            "current_question_number": answered_count + 1,
            "total_questions": interview.total_questions,
            "is_last_question": answered_count + 1 >= interview.total_questions,
            "progress_percentage": (answered_count / interview.total_questions) * 100
        }
    
    def submit_answer(self, user_id: int, answer_data: AnswerCreate) -> dict:
        """
        Submit an answer and get AI evaluation.
        
        Args:
            user_id: ID of the user
            answer_data: Answer submission data
            
        Returns:
            Dictionary with answer, evaluation, and next question
        """
        # Get question
        question = self.db.query(Question).filter(
            Question.id == answer_data.question_id
        ).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Verify user owns this interview
        interview = self.get_interview(question.interview_id, user_id)
        
        if question.is_answered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question already answered"
            )
        
        # Get AI evaluation
        evaluation = self.ai_service.evaluate_answer(
            question=question.question_text,
            answer=answer_data.answer_text,
            interview_type=interview.interview_type,
            expected_keywords=question.expected_keywords,
            ideal_answer=question.ideal_answer
        )
        
        # Save answer
        import json
        answer = Answer(
            question_id=question.id,
            answer_text=answer_data.answer_text,
            score=evaluation["score"],
            ai_feedback=evaluation["feedback"],
            strengths=json.dumps(evaluation["strengths"]),
            weaknesses=json.dumps(evaluation["weaknesses"]),
            suggestions=json.dumps(evaluation["suggestions"]),
            keywords_matched=json.dumps(evaluation.get("keywords_matched", [])),
            confidence_score=evaluation.get("confidence_score", 0.85),
            evaluated_at=datetime.utcnow()
        )
        
        self.db.add(answer)
        
        # Update question status
        question.is_answered = True
        
        # Update interview progress
        interview.answered_questions += 1
        interview.total_score += evaluation["score"]
        interview.average_score = interview.total_score / interview.answered_questions
        
        self.db.commit()
        self.db.refresh(answer)
        
        # Check if interview is complete
        is_complete = interview.answered_questions >= interview.total_questions
        
        if is_complete:
            self._complete_interview(interview)
        
        # Get next question if not complete
        next_question = None
        if not is_complete:
            next_question = self.db.query(Question).filter(
                Question.interview_id == interview.id,
                Question.is_answered == False
            ).order_by(Question.question_number).first()
        
        return {
            "answer": answer,
            "evaluation": evaluation,
            "next_question": next_question,
            "is_interview_complete": is_complete,
            "questions_remaining": interview.total_questions - interview.answered_questions
        }
    
    def _complete_interview(self, interview: Interview):
        """
        Complete an interview and generate overall feedback.
        
        Args:
            interview: Interview object to complete
        """
        interview.status = InterviewStatus.COMPLETED.value
        interview.completed_at = datetime.utcnow()
        
        if interview.started_at:
            duration = (interview.completed_at - interview.started_at).seconds // 60
            interview.duration_minutes = duration
        
        # Generate overall feedback
        questions_with_answers = []
        for question in interview.questions:
            if question.answer:
                questions_with_answers.append({
                    "question": question.question_text,
                    "answer": question.answer.answer_text,
                    "score": question.answer.score
                })
        
        overall_feedback = self.ai_service.generate_overall_feedback(
            interview_type=interview.interview_type,
            questions_and_answers=questions_with_answers,
            average_score=interview.average_score
        )
        
        import json
        feedback = Feedback(
            interview_id=interview.id,
            overall_score=interview.average_score,
            technical_score=overall_feedback.get("technical_score"),
            communication_score=overall_feedback.get("communication_score"),
            problem_solving_score=overall_feedback.get("problem_solving_score"),
            summary=overall_feedback.get("summary"),
            overall_strengths=json.dumps(overall_feedback.get("strengths", [])),
            overall_weaknesses=json.dumps(overall_feedback.get("weaknesses", [])),
            improvement_suggestions=json.dumps(overall_feedback.get("suggestions", [])),
            recommended_resources=json.dumps(overall_feedback.get("resources", [])),
            performance_grade=self._calculate_grade(interview.average_score)
        )
        
        self.db.add(feedback)
        self.db.commit()
    
    def _calculate_grade(self, score: float) -> str:
        """Calculate grade based on score"""
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
    
    def delete_interview(self, interview_id: int, user_id: int) -> bool:
        """
        Delete an interview.
        
        Args:
            interview_id: ID of the interview
            user_id: ID of the user
            
        Returns:
            True if successful
        """
        interview = self.get_interview(interview_id, user_id)
        
        self.db.delete(interview)
        self.db.commit()
        
        return True
