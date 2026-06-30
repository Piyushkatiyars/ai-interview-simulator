"""
Analytics Schemas - Pydantic Models for Dashboard Data
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class OverviewStats(BaseModel):
    """Overview statistics for dashboard"""
    total_interviews: int
    completed_interviews: int
    average_score: float
    best_score: float
    total_questions_answered: int
    current_streak: int  # Consecutive days with practice


class SkillAnalysis(BaseModel):
    """Analysis for a specific skill/interview type"""
    skill_name: str
    interview_count: int
    average_score: float
    best_score: float
    improvement_trend: str  # "improving", "stable", "declining"
    last_practiced: Optional[datetime] = None
    strengths: List[str] = []
    weaknesses: List[str] = []


class PerformanceTrend(BaseModel):
    """Performance trend data point"""
    date: str  # ISO date string
    score: float
    interview_type: str


class RecentInterview(BaseModel):
    """Recent interview summary"""
    id: int
    title: str
    interview_type: str
    score: float
    grade: str
    completed_at: datetime
    duration_minutes: Optional[int] = None


class DashboardResponse(BaseModel):
    """Complete dashboard response"""
    overview: OverviewStats
    skill_analysis: List[SkillAnalysis]
    performance_trends: List[PerformanceTrend]
    recent_interviews: List[RecentInterview]
    recommendations: List[str]


class ProgressReport(BaseModel):
    """Weekly/Monthly progress report"""
    period: str  # "weekly" or "monthly"
    start_date: datetime
    end_date: datetime
    interviews_completed: int
    average_score: float
    score_improvement: float  # Compared to previous period
    time_spent_minutes: int
    skill_breakdown: Dict[str, float]  # skill -> average score
    top_achievements: List[str]
    areas_to_focus: List[str]


class LeaderboardEntry(BaseModel):
    """Leaderboard entry (optional feature)"""
    rank: int
    username: str
    avatar_url: Optional[str] = None
    total_score: float
    interviews_completed: int
    best_skill: str


class AnalyticsFilters(BaseModel):
    """Filters for analytics queries"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    interview_type: Optional[str] = None
    difficulty: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)
