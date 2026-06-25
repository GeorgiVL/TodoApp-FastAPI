# Utils is going to have all the reusable code
from sqlalchemy import create_engine, StaticPool, text
from sqlalchemy.orm import sessionmaker
from ..main import app
from ..models import Todos, Users
from ..database import Base
from fastapi.testclient import TestClient
from passlib.context import CryptContext
import pytest

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_current_user():
    return {'username': 'codingwithgeorgi', 'id': 1, 'user_role': 'admin'}


# Create a test client
client = TestClient(app)


@pytest.fixture
def test_todo():
    todo = Todos(title="Learn to code!", description="Need to learn everyday!", priority=5, complete=False, owner_id=1)
    db = TestingSessionLocal()
    db.add(todo)
    db.commit()
    yield todo
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM todos;"))
        connection.commit()


@pytest.fixture
def test_user():
    user = Users(username="codingwithgeorgi", email="codingwithgeorgi@email.com", first_name="Georgi",
                 last_name="Valkanov", hashed_password=bcrypt_context.hash("password"),
                 phone_number="123456789", role="admin", is_active=True)
    db = TestingSessionLocal()
    db.add(user)
    db.commit()
    yield user
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM users;"))
        connection.commit()
