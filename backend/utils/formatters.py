"""Formatting utility functions."""
from datetime import datetime


def format_uptime(created_at):
    """Format container uptime.

    Args:
        created_at: ISO format datetime string

    Returns:
        Formatted uptime string (e.g., "2d 3h", "5h 30m", "15m")
    """
    created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    now = datetime.now(created.tzinfo)
    delta = now - created

    days = delta.days
    hours = delta.seconds // 3600
    minutes = (delta.seconds % 3600) // 60

    if days > 0:
        return f"{days}d {hours}h"
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"
