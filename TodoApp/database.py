import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Load variables from a .env file (if present) so secrets stay out of source control.
load_dotenv()

# Database connection string. Override with DATABASE_URL in .env; falls back to the
# local Postgres instance used in development.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost/TodoApplicationDatabase",
)

# Telling SQLAlchemy how to connect to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Telling SQLAlchemy how to create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Telling SQLAlchemy how to create a base class for our models
Base = declarative_base()
