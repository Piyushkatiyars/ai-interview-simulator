"""
Utility Helper Functions
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import re


def calculate_percentage(part: float, whole: float) -> float:
    """Calculate percentage safely"""
    if whole == 0:
        return 0.0
    return round((part / whole) * 100, 2)


def format_datetime(dt: datetime) -> str:
    """Format datetime to readable string"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def generate_interview_summary(scores: list) -> Dict[str, Any]:
    """Generate summary statistics from scores"""
    if not scores:
        return {
            "total": 0,
            "average": 0.0,
            "highest": 0,
            "lowest": 0
        }
    
    return {
        "total": len(scores),
        "average": round(sum(scores) / len(scores), 2),
        "highest": max(scores),
        "lowest": min(scores)
    }


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_input(text: str) -> str:
    """Sanitize user input"""
    # Remove potentially dangerous characters
    return re.sub(r'[<>"\']', '', text.strip())


def get_skill_category(interview_type: str) -> str:
    """Map interview type to skill category"""
    categories = {
        "hr": "Soft Skills",
        "python": "Programming",
        "web_development": "Web Technologies",
        "cloud_computing": "Cloud & DevOps"
    }
    return categories.get(interview_type.lower(), "General")


def calculate_performance_trend(scores: list) -> str:
    """Calculate performance trend from recent scores"""
    if len(scores) < 2:
        return "neutral"
    
    recent_avg = sum(scores[:3]) / min(3, len(scores))
    older_avg = sum(scores[3:6]) / max(1, min(3, len(scores[3:6]))) if len(scores) > 3 else recent_avg
    
    if recent_avg > older_avg + 0.5:
        return "improving"
    elif recent_avg < older_avg - 0.5:
        return "declining"
    return "stable"
