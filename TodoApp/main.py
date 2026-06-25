import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import Base
from .routers import auth, todos, admin, users
from .database import engine

app = FastAPI(title="TodoApp API")

# Create the database
Base.metadata.create_all(bind=engine)

# Allow the React dev server (and any extra origins from CORS_ORIGINS) to call the API.
# CORS_ORIGINS is a comma-separated list, e.g. "http://localhost:5173,https://todo.example.com".
default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthy")
def healthy():
    return {"status": "Healthy"}


app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(admin.router)
app.include_router(users.router)
