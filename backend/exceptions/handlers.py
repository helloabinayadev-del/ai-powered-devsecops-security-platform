from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.logger import logger


# ==========================================
# HTTP Exception
# ==========================================

async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):

    logger.error(f"HTTP Error: {exc.detail}")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )


# ==========================================
# Validation Exception
# ==========================================

async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):

    logger.error(str(exc))

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation Error",
            "errors": exc.errors()
        }
    )


# ==========================================
# Global Exception
# ==========================================

async def global_exception_handler(
    request: Request,
    exc: Exception
):

    logger.error(str(exc))

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error"
        }
    )
