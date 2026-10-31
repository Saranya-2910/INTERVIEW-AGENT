import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.users import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, name: str, email: str, password: str) -> User:
        existing = self.repo.get_by_email(email)
        if existing:
            raise ConflictException("An account with this email address already exists")

        pwd_hash = hash_password(password)
        user = self.repo.create(name=name, email=email, password_hash=pwd_hash)
        return user

    def authenticate(self, email: str, password: str) -> str:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        token = create_access_token(
            subject=str(user.id), extra_claims={"email": user.email, "name": user.name}
        )
        return token

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.repo.get_by_id(user_id)
