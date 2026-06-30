"""
Analytics Service - Business Logic for Dashboard Analytics
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.models.interview import Interview, InterviewStatus
from app.models.question import Question
from app.models.answer import Answer
from app.models.feedback import Feedback


class AnalyticsService:
    """Service class for analytics and dashboard data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        """
        Get complete dashboard data for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dictionary containing all dashboard metrics
        """
        overview = self.get_overview_stats(user_id)
        skill_analysis = self.get_skill_analysis(user_id)
        performance_trends = self.get_performance_trends(user_id)
        recent_interviews = self.get_recent_interviews(user_id, limit=5)
        recommendations = self.get_recommendations(user_id)
        
        return {
            "overview": overview,
            "skill_analysis": skill_analysis,
            "performance_trends": performance_trends,
            "recent_interviews": recent_interviews,
            "recommendations": recommendations
        }
    
    def get_overview_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Get overview statistics for dashboard.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Overview statistics dictionary
        """
        # Total interviews
        total_interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id
        ).count()
        
        # Completed interviews
        completed_interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value
        ).count()
        
        # Average score
        avg_result = self.db.query(func.avg(Interview.average_score)).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value
        ).scalar()
        average_score = round(float(avg_result or 0), 2)
        
        # Best score
        best_result = self.db.query(func.max(Interview.average_score)).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value
        ).scalar()
        best_score = round(float(best_result or 0), 2)
        
        # Total questions answered
        total_questions = self.db.query(Question).join(Interview).filter(
            Interview.user_id == user_id,
            Question.is_answered == True
        ).count()
        
        # Current streak (consecutive days)
        current_streak = self._calculate_streak(user_id)
        
        return {
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "average_score": average_score,
            "best_score": best_score,
            "total_questions_answered": total_questions,
            "current_streak": current_streak
        }
    
    def get_skill_analysis(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get skill-wise analysis.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of skill analysis dictionaries
        """
        # Get stats by interview type
        skills = self.db.query(
            Interview.interview_type,
            func.count(Interview.id).label('count'),
            func.avg(Interview.average_score).label('avg_score'),
            func.max(Interview.average_score).label('best_score'),
            func.max(Interview.completed_at).label('last_practiced')
        ).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value
        ).group_by(Interview.interview_type).all()
        
        skill_analysis = []
        for skill in skills:
            # Get recent scores to determine trend
            recent_scores = self.db.query(Interview.average_score).filter(
                Interview.user_id == user_id,
                Interview.interview_type == skill.interview_type,
                Interview.status == InterviewStatus.COMPLETED.value
            ).order_by(desc(Interview.completed_at)).limit(5).all()
            
            scores = [s[0] for s in recent_scores]
            trend = self._calculate_trend(scores)
            
            skill_analysis.append({
                "skill_name": self._format_skill_name(skill.interview_type),
                "interview_count": skill.count,
                "average_score": round(float(skill.avg_score or 0), 2),
                "best_score": round(float(skill.best_score or 0), 2),
                "improvement_trend": trend,
                "last_practiced": skill.last_practiced.isoformat() if skill.last_practiced else None,
                "strengths": [],
                "weaknesses": []
            })
        
        return skill_analysis
    
    def get_performance_trends(
        self,
        user_id: int,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get performance trends over time.
        
        Args:
            user_id: ID of the user
            days: Number of days to look back
            
        Returns:
            List of performance data points
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value,
            Interview.completed_at >= start_date
        ).order_by(Interview.completed_at).all()
        
        trends = []
        for interview in interviews:
            trends.append({
                "date": interview.completed_at.strftime("%Y-%m-%d"),
                "score": interview.average_score,
                "interview_type": interview.interview_type
            })
        
        return trends
    
    def get_recent_interviews(
        self,
        user_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get recent completed interviews.
        
        Args:
            user_id: ID of the user
            limit: Number of interviews to return
            
        Returns:
            List of recent interview summaries
        """
        interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value
        ).order_by(desc(Interview.completed_at)).limit(limit).all()
        
        recent = []
        for interview in interviews:
            recent.append({
                "id": interview.id,
                "title": interview.title,
                "interview_type": interview.interview_type,
                "score": interview.average_score,
                "grade": self._calculate_grade(interview.average_score),
                "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
                "duration_minutes": interview.duration_minutes
            })
        
        return recent
    
    def get_recommendations(self, user_id: int) -> List[str]:
        """
        Get personalized recommendations.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Get skill analysis
        skills = self.get_skill_analysis(user_id)
        
        if not skills:
            recommendations.append("Start your first interview to get personalized recommendations!")
            return recommendations
        
        # Find weakest skill
        weakest = min(skills, key=lambda x: x["average_score"])
        if weakest["average_score"] < 7:
            recommendations.append(
                f"Focus on {weakest['skill_name']} - your average score is {weakest['average_score']}/10"
            )
        
        # Check for declining trends
        declining = [s for s in skills if s["improvement_trend"] == "declining"]
        if declining:
            recommendations.append(
                f"Review {declining[0]['skill_name']} - your performance has been declining recently"
            )
        
        # Check streak
        overview = self.get_overview_stats(user_id)
        if overview["current_streak"] == 0:
            recommendations.append("Practice daily to build your streak and improve retention!")
        elif overview["current_streak"] >= 7:
            recommendations.append(f"Great job! {overview['current_streak']} day streak - keep it up!")
        
        # Check total interviews
        if overview["total_interviews"] < 5:
            recommendations.append("Complete more interviews to get comprehensive analytics")
        
        # Suggest next interview type
        if skills:
            oldest_practiced = min(skills, key=lambda x: x["last_practiced"] or "")
            recommendations.append(f"It's been a while since you practiced {oldest_practiced['skill_name']}")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def get_progress_report(
        self,
        user_id: int,
        period: str = "weekly"
    ) -> Dict[str, Any]:
        """
        Generate a progress report.
        
        Args:
            user_id: ID of the user
            period: "weekly" or "monthly"
            
        Returns:
            Progress report dictionary
        """
        if period == "weekly":
            days = 7
        else:
            days = 30
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        previous_start = start_date - timedelta(days=days)
        
        # Current period stats
        current_interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value,
            Interview.completed_at >= start_date,
            Interview.completed_at <= end_date
        ).all()
        
        # Previous period stats
        previous_interviews = self.db.query(Interview).filter(
            Interview.user_id == user_id,
            Interview.status == InterviewStatus.COMPLETED.value,
            Interview.completed_at >= previous_start,
            Interview.completed_at < start_date
        ).all()
        
        current_avg = sum(i.average_score for i in current_interviews) / len(current_interviews) if current_interviews else 0
        previous_avg = sum(i.average_score for i in previous_interviews) / len(previous_interviews) if previous_interviews else 0
        
        # Time spent
        time_spent = sum(i.duration_minutes or 0 for i in current_interviews)
        
        # Skill breakdown
        skill_breakdown = {}
        for interview in current_interviews:
            skill = interview.interview_type
            if skill not in skill_breakdown:
                skill_breakdown[skill] = []
            skill_breakdown[skill].append(interview.average_score)
        
        skill_breakdown = {k: round(sum(v)/len(v), 2) for k, v in skill_breakdown.items()}
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "interviews_completed": len(current_interviews),
            "average_score": round(current_avg, 2),
            "score_improvement": round(current_avg - previous_avg, 2),
            "time_spent_minutes": time_spent,
            "skill_breakdown": skill_breakdown,
            "top_achievements": self._get_achievements(current_interviews),
            "areas_to_focus": self._get_focus_areas(current_interviews)
        }
    
    def _calculate_streak(self, user_id: int) -> int:
        """Calculate current practice streak"""
        today = datetime.utcnow().date()
        streak = 0
        current_date = today
        
        while True:
            has_interview = self.db.query(Interview).filter(
                Interview.user_id == user_id,
                func.date(Interview.completed_at) == current_date
            ).first()
            
            if has_interview:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        return streak
    
    def _calculate_trend(self, scores: List[float]) -> str:
        """Calculate performance trend from recent scores"""
        if len(scores) < 2:
            return "stable"
        
        recent = sum(scores[:2]) / min(2, len(scores))
        older = sum(scores[2:]) / max(1, len(scores[2:])) if len(scores) > 2 else recent
        
        if recent > older + 0.5:
            return "improving"
        elif recent < older - 0.5:
            return "declining"
        return "stable"
    
    def _calculate_grade(self, score: float) -> str:
        """Calculate grade from score"""
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
        return "F"
    
    def _format_skill_name(self, skill_type: str) -> str:
        """Format skill type to display name"""
        names = {
            "hr": "HR & Behavioral",
            "python": "Python Programming",
            "web_development": "Web Development",
            "cloud_computing": "Cloud Computing"
        }
        return names.get(skill_type, skill_type.replace("_", " ").title())
    
    def _get_achievements(self, interviews: List[Interview]) -> List[str]:
        """Get achievements from interviews"""
        achievements = []
        
        if not interviews:
            return achievements
        
        best_score = max(i.average_score for i in interviews)
        if best_score >= 9:
            achievements.append(f"Excellent score: {best_score}/10")
        
        if len(interviews) >= 5:
            achievements.append(f"Completed {len(interviews)} interviews")
        
        return achievements
    
    def _get_focus_areas(self, interviews: List[Interview]) -> List[str]:
        """Get areas that need focus"""
        focus_areas = []
        
        for interview in interviews:
            if interview.average_score < 6:
                focus_areas.append(f"Improve {self._format_skill_name(interview.interview_type)}")
        
        return list(set(focus_areas))[:3]
