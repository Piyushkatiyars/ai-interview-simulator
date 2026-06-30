"""
Analytics API Endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.schemas.analytics import (
    DashboardResponse, OverviewStats, SkillAnalysis,
    PerformanceTrend, RecentInterview, ProgressReport
)
from app.services.analytics_service import AnalyticsService
from app.auth.jwt_handler import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard data.
    
    Returns:
    - Overview statistics
    - Skill analysis
    - Performance trends
    - Recent interviews
    - Personalized recommendations
    """
    service = AnalyticsService(db)
    dashboard = service.get_dashboard_data(current_user.id)
    return dashboard


@router.get("/overview")
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get overview statistics.
    
    Returns aggregated stats like total interviews, average score, streak, etc.
    """
    service = AnalyticsService(db)
    overview = service.get_overview_stats(current_user.id)
    return overview


@router.get("/skills")
async def get_skill_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get skill-wise analysis.
    
    Returns performance breakdown by interview type (HR, Python, Web Dev, Cloud).
    """
    service = AnalyticsService(db)
    skills = service.get_skill_analysis(current_user.id)
    return skills


@router.get("/trends")
async def get_performance_trends(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get performance trends over time.
    
    - **days**: Number of days to look back (default 30, min 7, max 365)
    """
    service = AnalyticsService(db)
    trends = service.get_performance_trends(current_user.id, days)
    return trends


@router.get("/recent")
async def get_recent_interviews(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent completed interviews.
    
    - **limit**: Number of interviews to return (default 5, max 20)
    """
    service = AnalyticsService(db)
    recent = service.get_recent_interviews(current_user.id, limit)
    return recent


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations.
    
    Returns tailored suggestions based on performance patterns.
    """
    service = AnalyticsService(db)
    recommendations = service.get_recommendations(current_user.id)
    return {"recommendations": recommendations}


@router.get("/progress-report")
async def get_progress_report(
    period: str = Query("weekly", regex="^(weekly|monthly)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get progress report for a period.
    
    - **period**: "weekly" or "monthly"
    
    Returns detailed progress analysis comparing current and previous periods.
    """
    service = AnalyticsService(db)
    report = service.get_progress_report(current_user.id, period)
    return report


@router.get("/interview-types")
async def get_interview_types():
    """
    Get available interview types.
    
    Returns list of interview types with descriptions.
    """
    return {
        "interview_types": [
            {
                "id": "hr",
                "name": "HR & Behavioral",
                "description": "Behavioral questions, situational scenarios, and soft skills assessment",
                "icon": "👥"
            },
            {
                "id": "python",
                "name": "Python Programming",
                "description": "Python fundamentals, data structures, algorithms, and best practices",
                "icon": "🐍"
            },
            {
                "id": "web_development",
                "name": "Web Development",
                "description": "HTML, CSS, JavaScript, React, APIs, and web technologies",
                "icon": "🌐"
            },
            {
                "id": "cloud_computing",
                "name": "Cloud Computing",
                "description": "AWS, Azure, GCP, DevOps, containers, and infrastructure",
                "icon": "☁️"
            }
        ]
    }


@router.get("/difficulty-levels")
async def get_difficulty_levels():
    """
    Get available difficulty levels.
    
    Returns list of difficulty levels with descriptions.
    """
    return {
        "difficulty_levels": [
            {
                "id": "beginner",
                "name": "Beginner",
                "description": "Fundamental concepts and basic questions"
            },
            {
                "id": "intermediate",
                "name": "Intermediate",
                "description": "In-depth questions requiring solid understanding"
            },
            {
                "id": "advanced",
                "name": "Advanced",
                "description": "Complex scenarios and expert-level questions"
            }
        ]
    }
