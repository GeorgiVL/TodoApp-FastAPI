from ..routers.auth import get_db, authenticate_user, create_access_token, SECRET_KEY, ALGORITHM, get_current_user
from .utils import *
from jose import jwt
from datetime import timedelta
import pytest
from fastapi import HTTPException

app.dependency_overrides[get_db] = override_get_db


def test_authenticate_user(test_user):
    db = TestingSessionLocal()
    authenticated_user = authenticate_user("codingwithgeorgi", "password", db)
    assert authenticated_user is not None
    assert authenticated_user.username == test_user.username


def test_authenticate_user_invalid(test_user):
    db = TestingSessionLocal()
    non_authenticated_user = authenticate_user("WrongUsername", "password", db)
    assert non_authenticated_user is False


def test_wrong_password_user(test_user):
    db = TestingSessionLocal()
    non_authenticated_user = authenticate_user("codingwithgeorgi", "wrong_password", db)
    assert non_authenticated_user is False


# Create test for access_token creation
def test_create_access_token():
    username = "testuser"
    user_id = 1
    role = 'user'
    expires_delta = timedelta(days=1)
    access_token = create_access_token(username, user_id, role, expires_delta)
    decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM], options={'verify_signature': False})
    assert decoded_token["sub"] == username
    assert decoded_token["id"] == user_id
    assert decoded_token["role"] == role


# Create test for get_current_user
@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    encode = {'sub': 'testuser', 'id': 1, 'role': 'admin'}
    token = jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)
    user = await get_current_user(token)
    assert user == {'username': 'testuser', 'id': 1, 'user_role': 'admin'}


# Create test for get_current_user invalid token
@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    encode = {'role': 'admin'}
    token = jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(token=token)
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == 'Could not validate credentials'
