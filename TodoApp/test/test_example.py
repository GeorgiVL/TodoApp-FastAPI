# Unit Tests
import pytest


def test_equal_or_not_equal():
    assert 3 == 3
    assert 3 != 4


def test_is_instance():
    assert isinstance(3, int)
    assert isinstance(3.14, float)
    assert isinstance("Hello", str)
    assert isinstance([1, 2, 3], list)
    assert isinstance((1, 2, 3), tuple)
    assert isinstance({1, 2, 3}, set)
    assert isinstance({"a": 1, "b": 2, "c": 3}, dict)
    assert not isinstance(3, str)


def test_boolean():
    assert True
    assert not False
    assert ('hello' == 'world') is False


def test_type():
    assert type('Hello' is str)
    assert type('World' is not int)


def test_greater_and_less_than():
    assert 5 > 3
    assert 3 < 5
    assert 5 >= 3
    assert 3 <= 5


def test_list():
    num_list = [1, 2, 3, 4, 5]
    any_list = [False, False]
    assert 1 in num_list
    assert not any(any_list)
    assert all(num_list)


class Student:
    def __init__(self, first_name: str, last_name: str, major: str, years: int):
        self.first_name = first_name
        self.last_name = last_name
        self.major = major
        self.years = years


@pytest.fixture
def default_student():
    return Student("John", "Doe", "Computer Science", 4)


def test_person_initialization(default_student):
    assert default_student.first_name == "John", "First name is not John"
    assert default_student.last_name == "Doe", "Last name is not Doe"
    assert default_student.major == "Computer Science", "Major is not Computer Science"
    assert default_student.years == 4, "Years is not 4"
