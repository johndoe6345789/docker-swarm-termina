import pytest
from datetime import datetime, timezone
from app import format_uptime


class TestUtilityFunctions:
    """Test utility functions"""

    def test_format_uptime_days(self):
        """Test uptime formatting for days"""
        # Create a timestamp 2 days and 3 hours ago
        now = datetime.now(timezone.utc)
        created_at = now.replace(day=now.day-2, hour=now.hour-3)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'd' in result
        assert 'h' in result

    def test_format_uptime_hours(self):
        """Test uptime formatting for hours"""
        # Create a timestamp 3 hours and 15 minutes ago
        now = datetime.now(timezone.utc)
        created_at = now.replace(hour=now.hour-3, minute=now.minute-15)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'h' in result
        assert 'm' in result
        assert 'd' not in result

    def test_format_uptime_minutes(self):
        """Test uptime formatting for minutes"""
        # Create a timestamp 30 minutes ago
        now = datetime.now(timezone.utc)
        created_at = now.replace(minute=now.minute-30)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'm' in result
        assert 'h' not in result
        assert 'd' not in result
