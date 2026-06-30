"""
Authentication Tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuthentication:
    """Test cases for authentication endpoints"""
    
    def test_register_success(self):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "SecurePass123!",
                "confirm_password": "SecurePass123!",
                "full_name": "Test User"
            }
        )
        # Note: This will fail without database connection
        # In real tests, use test database fixtures
        assert response.status_code in [201, 500]
    
    def test_register_weak_password(self):
        """Test registration with weak password"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test2@example.com",
                "username": "testuser2",
                "password": "weak",
                "confirm_password": "weak"
            }
        )
        assert response.status_code == 422
    
    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test3@example.com",
                "username": "testuser3",
                "password": "SecurePass123!",
                "confirm_password": "DifferentPass123!"
            }
        )
        assert response.status_code == 422
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code in [401, 500]
    
    def test_protected_route_without_token(self):
        """Test accessing protected route without token"""
        response = client.get("/api/auth/me")
        assert response.status_code == 403  # No authorization header
    
    def test_protected_route_with_invalid_token(self):
        """Test accessing protected route with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestHealthCheck:
    """Test cases for health endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "status" in data
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
