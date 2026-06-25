from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Telling which database to use
SQLALCHEMY_DATABASE_URL = 'postgresql://postgres:Acronis_12345@localhost/TodoApplicationDatabase'

# Telling SQLAlchemy how to connect to the database, where check_same_thread means that the database is only used by one thread
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Telling SQLAlchemy how to create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Telling SQLAlchemy how to create a base class for our models
Base = declarative_base()