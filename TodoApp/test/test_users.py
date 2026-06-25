from ..routers.auth import get_current_user
from ..routers.users import get_db, bcrypt_context
from fastapi import status
from .utils import *
from ..models import Users

# Override dependencies
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


def test_read_all_users_authenticated(test_user):
    response = client.get("/users/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['username'] == 'codingwithgeorgi'
    assert response.json()['email'] == 'codingwithgeorgi@email.com'
    assert response.json()['first_name'] == 'Georgi'
    assert response.json()['last_name'] == 'Valkanov'
    assert response.json()['phone_number'] == '123456789'
    assert response.json()['role'] == 'admin'
    assert response.json()['is_active'] == True


# Create a test for password update
def test_update_password(test_user):
    response = client.put("/users/password", json={"password": "password", "new_password": "new_password"})
    assert response.status_code == status.HTTP_204_NO_CONTENT
    db = TestingSessionLocal()
    user_model = db.query(Users).filter(Users.id == test_user.id).first()
    assert bcrypt_context.verify("new_password", user_model.hashed_password)


# Create a test for password update not found
def test_update_password_invalid_not_found(test_user):
    response = client.put("/users/password", json={"password": "wrong_password", "new_password": "new_password"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {'detail': 'Error on password change'}


# Create a test for phone number update
def test_phonenumber_update(test_user):
    response = client.put("/users/phonenumber/123456789")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    db = TestingSessionLocal()
    user_model = db.query(Users).filter(Users.id == test_user.id).first()
    assert user_model.phone_number == "123456789"
