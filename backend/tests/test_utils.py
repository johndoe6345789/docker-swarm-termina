import pytest
from datetime import datetime, timezone, timedelta
from utils.formatters import format_uptime


class TestUtilityFunctions:
    """Test utility functions"""

    def test_format_uptime_days(self):
        """Test uptime formatting for days"""
        # Create a timestamp 2 days and 3 hours ago
        now = datetime.now(timezone.utc)
        created_at = now - timedelta(days=2, hours=3)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'd' in result
        assert 'h' in result

    def test_format_uptime_hours(self):
        """Test uptime formatting for hours"""
        # Create a timestamp 3 hours and 15 minutes ago
        now = datetime.now(timezone.utc)
        created_at = now - timedelta(hours=3, minutes=15)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'h' in result
        assert 'm' in result
        assert 'd' not in result

    def test_format_uptime_minutes(self):
        """Test uptime formatting for minutes"""
        # Create a timestamp 30 minutes ago
        now = datetime.now(timezone.utc)
        created_at = now - timedelta(minutes=30)
        created_str = created_at.isoformat().replace('+00:00', 'Z')

        result = format_uptime(created_str)
        assert 'm' in result
        assert 'h' not in result
        assert 'd' not in result
