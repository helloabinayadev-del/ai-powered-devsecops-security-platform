from starlette.middleware.base import BaseHTTPMiddleware
from backend.logger import logger


class RequestLoggerMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):
        logger.info(f"Request Started: {request.method} {request.url.path}")

        response = await call_next(request)

        logger.info(f"Request Completed: {response.status_code}")

        return response
