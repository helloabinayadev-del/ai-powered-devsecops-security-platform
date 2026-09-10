"""
Simple in-memory rate limiter for API endpoints.
For production, consider using Redis-based rate limiting.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from functools import wraps
import time

# In-memory store for rate limiting
# Key: (endpoint, client_ip) -> list of timestamps
_rate_limit_store = defaultdict(list)

# Cleanup old entries periodically
_last_cleanup = time.time()
_cleanup_interval = 300  # 5 minutes


def reset_rate_limiter():
    """Clear all rate limit entries (useful for testing)."""
    _rate_limit_store.clear()


def cleanup_old_entries():
    """Remove entries older than 1 minute from rate limit store."""
    global _last_cleanup
    current_time = time.time()
    
    if current_time - _last_cleanup < _cleanup_interval:
        return
    
    _last_cleanup = current_time
    cutoff = current_time - 60  # 1 minute ago
    
    for key in list(_rate_limit_store.keys()):
        _rate_limit_store[key] = [
            ts for ts in _rate_limit_store[key] if ts > cutoff
        ]
        
        if not _rate_limit_store[key]:
            del _rate_limit_store[key]


def check_rate_limit(request: Request, limit: int = 60) -> bool:
    """
    Check if the request should be rate limited.
    
    Args:
        request: FastAPI request object
        limit: Maximum requests per minute
        
    Returns:
        True if request is allowed, False if rate limited
    """
    cleanup_old_entries()
    
    client_ip = request.client.host if request.client else "unknown"
    endpoint = request.url.path
    key = (endpoint, client_ip)
    
    current_time = time.time()
    
    # Remove timestamps older than 1 minute
    _rate_limit_store[key] = [
        ts for ts in _rate_limit_store[key] if current_time - ts < 60
    ]
    
    # Check if limit exceeded
    if len(_rate_limit_store[key]) >= limit:
        return False
    
    # Add current request timestamp
    _rate_limit_store[key].append(current_time)
    return True


def rate_limit(max_requests: int = 60):
    """
    Decorator for rate limiting endpoints.
    
    Args:
        max_requests: Maximum requests per minute
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs (FastAPI dependency injection)
            request = kwargs.get('request')
            if not request:
                # Try to get request from args
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request and not check_rate_limit(request, max_requests):
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again later."
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
