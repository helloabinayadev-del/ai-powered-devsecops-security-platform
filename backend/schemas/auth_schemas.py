from pydantic import BaseModel, Field


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="The user's current password")
    new_password: str = Field(..., min_length=8, description="The new password (min 8 characters)")


class UserResponse(BaseModel):
    username: str
    role: str

    class Config:
        from_attributes = True
