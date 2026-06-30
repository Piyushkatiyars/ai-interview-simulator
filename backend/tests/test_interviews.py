"""
Interview Tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestInterviewEndpoints:
    """Test cases for interview endpoints"""
    
    def test_create_interview_unauthorized(self):
        """Test creating interview without authentication"""
        response = client.post(
            "/api/interviews/",
            json={
                "title": "Test Interview",
                "interview_type": "python",
                "difficulty": "intermediate",
                "total_questions": 5
            }
        )
        assert response.status_code == 403
    
    def test_list_interviews_unauthorized(self):
        """Test listing interviews without authentication"""
        response = client.get("/api/interviews/")
        assert response.status_code == 403
    
    def test_interview_types_endpoint(self):
        """Test getting interview types"""
        response = client.get("/api/analytics/interview-types")
        assert response.status_code == 200
        data = response.json()
        assert "interview_types" in data
        assert len(data["interview_types"]) == 4
    
    def test_difficulty_levels_endpoint(self):
        """Test getting difficulty levels"""
        response = client.get("/api/analytics/difficulty-levels")
        assert response.status_code == 200
        data = response.json()
        assert "difficulty_levels" in data
        assert len(data["difficulty_levels"]) == 3


class TestAnalyticsEndpoints:
    """Test cases for analytics endpoints"""
    
    def test_dashboard_unauthorized(self):
        """Test accessing dashboard without authentication"""
        response = client.get("/api/analytics/dashboard")
        assert response.status_code == 403
    
    def test_overview_unauthorized(self):
        """Test accessing overview without authentication"""
        response = client.get("/api/analytics/overview")
        assert response.status_code == 403
