from pydantic import BaseModel, EmailStr, Field

class SignupModel(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    full_name: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class LoginModel(BaseModel):
    username: str
    password: str
