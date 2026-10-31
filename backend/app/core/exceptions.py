from typing import Any

from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
        headers: dict | None = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details,
                }
            },
            headers=headers,
        )
        self.code = code
        self.message = message
        self.details = details


class UnauthorizedException(AppException):
    def __init__(
        self, message: str = "Authentication credentials were not provided or are invalid"
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to access this resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "Requested resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "A resource conflict occurred"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            message=message,
        )


class AIProviderException(AppException):
    def __init__(
        self, message: str = "AI service is temporarily unavailable. Please try again shortly."
    ):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="AI_PROVIDER_UNAVAILABLE",
            message=message,
        )


class InvalidStateTransitionException(AppException):
    def __init__(
        self, message: str = "Interview is not in an appropriate state for this operation"
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_STATE_TRANSITION",
            message=message,
        )
