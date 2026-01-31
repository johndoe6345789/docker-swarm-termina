import pytest
from datetime import datetime


class TestAuthentication:
    """Test authentication endpoints"""

    def test_login_success(self, client):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'token' in data
        assert data['username'] == 'admin'

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'wrongpassword'
        })

        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] is False
        assert 'message' in data

    def test_login_missing_username(self, client):
        """Test login with missing username"""
        response = client.post('/api/auth/login', json={
            'password': 'admin123'
        })

        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] is False

    def test_login_missing_password(self, client):
        """Test login with missing password"""
        response = client.post('/api/auth/login', json={
            'username': 'admin'
        })

        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] is False

    def test_logout_success(self, client, auth_token):
        """Test successful logout"""
        response = client.post('/api/auth/logout', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True

    def test_logout_without_token(self, client):
        """Test logout without token"""
        response = client.post('/api/auth/logout')

        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
