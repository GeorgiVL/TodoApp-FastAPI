# TodoApp — FastAPI + React

A full-stack todo application: a **FastAPI** REST backend (JWT auth, PostgreSQL) and a
**React + TypeScript** frontend (Vite). Users register, log in, and manage their own todos
end to end.

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Backend | FastAPI, SQLAlchemy 2, PostgreSQL (psycopg2), Alembic, python-jose (JWT), passlib/bcrypt, Uvicorn |
| Frontend | React 19, TypeScript, Vite, React Router |
| Tests | pytest, Starlette `TestClient` (SQLite), Playwright E2E (Chromium) |
| Docker | Docker, Docker Compose (Postgres + FastAPI + Nginx) |

---

## Project structure

```
fastapi/
├── TodoApp/                 # FastAPI backend
│   ├── main.py              # App entry: CORS, router registration, /healthy
│   ├── database.py          # SQLAlchemy engine/session (reads DATABASE_URL from .env)
│   ├── models.py            # Users, Todos
│   ├── routers/             # auth, todos, users, admin
│   ├── alembic/             # DB migrations
│   └── test/                # pytest suite
├── frontend/                # React + TypeScript (Vite)
│   ├── Dockerfile           # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf           # SPA + API reverse proxy
│   ├── playwright.config.ts # E2E test configuration
│   ├── e2e/                 # Playwright E2E tests + Dockerfile
│   └── src/
│       ├── api/             # fetch client, auth + todos + users + admin calls
│       ├── auth/            # AuthContext, ProtectedRoute, AdminRoute
│       ├── components/      # Navbar, TodoForm, TodoItem, HealthBadge
│       └── pages/           # LoginPage, RegisterPage, TodosPage, ProfilePage, AdminPage
├── Dockerfile              # Backend image
├── docker-compose.yml      # db + backend + frontend + e2e (optional profile)
├── .env.example            # Backend environment template
├── requirements.txt        # Python dependencies
└── README.md
```

---

## Prerequisites

**Option A — Docker (recommended for quick start):**
- **Docker** and **Docker Compose** installed

**Option B — Local development:**
- **Python** 3.11+
- **Node.js** 18+ and npm
- **PostgreSQL** 13+ running locally *(or use the SQLite fallback — see below)*

---

## Quick start with Docker

The entire stack (PostgreSQL + FastAPI + Nginx-served React) runs with a single command:

```bash
docker compose up --build
```

That's it. The app is available at:

| Service | URL |
|---------|-----|
| Frontend (React) | **http://localhost:3000** |
| Backend API | **http://localhost:8000** |
| Swagger docs | **http://localhost:8000/docs** |
| PostgreSQL | `localhost:5432` |

To stop: `docker compose down` (add `-v` to also delete the database volume).

### Docker architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  frontend   │────▶│   backend    │────▶│      db      │
│  (Nginx)    │     │  (FastAPI)   │     │ (PostgreSQL) │
│  :3000      │     │  :8000       │     │  :5432       │
└─────────────┘     └──────────────┘     └──────────────┘
       ▲
       │ (optional: --profile test)
┌──────┴──────┐
│    e2e      │
│ (Playwright)│
└─────────────┘
```

- **frontend**: Multi-stage Dockerfile — Node builds the Vite app, Nginx serves the
  static files on port 3000 and reverse-proxies `/auth/`, `/todos/`, `/users/`, `/admin/`,
  and `/healthy` to the backend container.
- **backend**: Python 3.12-slim image running uvicorn on port 8000.
- **db**: PostgreSQL 16 Alpine with a health check.
- **e2e** *(optional, `--profile test`)*: Node 22 Alpine with Playwright + Chromium. Runs all 50 E2E tests against the live Docker stack and exits.

### Overriding Docker settings

Create a `.env` file in the repo root to override any backend variable:
```dotenv
SECRET_KEY=<your-strong-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000,https://myapp.example.com
```

---

## Local development setup

### 1. Backend setup

All commands run from the **repository root**.

### a) Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### b) Install dependencies
```bash
pip install -r requirements.txt
```

### c) Configure environment variables

Copy the template and fill in your values:

**Windows (PowerShell):** `Copy-Item .env.example .env`
**macOS / Linux:** `cp .env.example .env`

Then edit `.env`:
```dotenv
# Database
DATABASE_URL=postgresql://postgres:<your-password>@localhost/TodoApplicationDatabase

# JWT auth — generate a strong secret:
#   python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<your-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS — origins allowed to call the API (the React dev server)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> `.env` is git-ignored — never commit real secrets. The app falls back to safe
> placeholder defaults if a value is missing.

### d) Create the database

Create a PostgreSQL database named **`TodoApplicationDatabase`** (matching your `DATABASE_URL`):
```bash
createdb -U postgres TodoApplicationDatabase
```
Tables are created automatically on startup. *(Alembic migrations are also available under `TodoApp/alembic/`.)*

> **No PostgreSQL?** You can run entirely on SQLite — set
> `DATABASE_URL=sqlite:///./dev.db` in `.env` and skip this step.

### e) Run the API
```bash
uvicorn TodoApp.main:app --reload --port 8000
```

- API base: **http://localhost:8000**
- Interactive docs (Swagger): **http://localhost:8000/docs**
- Health check: **http://localhost:8000/healthy**

---

## 2. Frontend setup

In a **second terminal**, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**.

By default the frontend calls the API at `http://localhost:8000`. To point elsewhere,
create `frontend/.env`:
```dotenv
VITE_API_URL=http://localhost:8000
```

---

## 3. Using the app

1. Open **http://localhost:5173** (local dev) or **http://localhost:3000** (Docker).
2. Click **Create one** to register an account (you'll be logged in automatically).
3. Add, edit, complete, and delete todos — each list is scoped to the logged-in user.
4. Visit **Profile** to view your account info, change your password, or update your phone number.
5. If your role is **admin**, an **Admin** link appears in the navbar — use it to view and delete todos across all users.

---

## API reference

All `/todos`, `/users`, and `/admin` routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/` | Register a new user |
| `POST` | `/auth/token` | Log in (OAuth2 password form) → JWT |
| `POST` | `/auth/refresh` | Exchange a valid JWT for a fresh one *(authenticated)* |
| `GET`  | `/todos/` | List the current user's todos |
| `POST` | `/todos/todo` | Create a todo |
| `GET`  | `/todos/todo/{id}` | Get one todo |
| `PUT`  | `/todos/todo/{id}` | Update a todo |
| `DELETE` | `/todos/todo/{id}` | Delete a todo |
| `GET`  | `/users/` | Current user's profile |
| `PUT`  | `/users/password` | Change password |
| `PUT`  | `/users/phonenumber/{phone_number}` | Update phone number |
| `GET`  | `/admin/todo` | List all todos *(admin role)* |
| `DELETE` | `/admin/todo/{id}` | Delete any todo *(admin role)* |

> The React frontend covers **all backend endpoints**: auth, todos, user profile
> management, and the admin dashboard.

---

## Running tests

### Backend unit tests (pytest)

The backend test suite uses a SQLite test database:

```bash
# With PostgreSQL reachable (uses your .env):
pytest TodoApp/test -q

# Without PostgreSQL — force SQLite for the app's startup:
#   Windows (PowerShell):
$env:DATABASE_URL = "sqlite:///./test_smoke.db"; pytest TodoApp/test -q
#   macOS / Linux:
DATABASE_URL=sqlite:///./test_smoke.db pytest TodoApp/test -q
```

### E2E tests (Playwright)

The E2E suite covers authentication, todo management, profile management, admin
dashboard, and navigation/route protection — 50 tests across 5 spec files.

**Option A — Local (requires backend + frontend running):**

Make sure the FastAPI backend is running on `http://localhost:8000`, then:

```bash
cd frontend
npm install        # if not already installed
npm run e2e        # headless (default)
npm run e2e:headed # visible browser
npm run e2e:ui     # interactive Playwright UI mode
```

Run a specific test file:
```bash
npx playwright test e2e/todos.spec.ts --headed
```

Run a specific test by name (partial match):
```bash
npx playwright test -g "Verify that a user can toggle" --headed
```

Run a specific test by file and line number:
```bash
npx playwright test e2e/todos.spec.ts:104 --headed
```

**Option B — Docker (runs the entire stack + tests in containers):**

```bash
docker compose --profile test up --build --abort-on-container-exit --exit-code-from e2e
```

This starts PostgreSQL, the FastAPI backend, the Nginx-served frontend, and a
Playwright container that runs all 50 tests against the live Docker stack.
The `--profile test` flag ensures the `e2e` service only runs when explicitly
requested (it won't start with a plain `docker compose up`).

---

## Notes

- **CORS** is configured in `TodoApp/main.py` via `CORS_ORIGINS`; add your frontend origin there for non-default ports or deployments.
- **Secrets** (`DATABASE_URL`, `SECRET_KEY`) load from `.env` through `python-dotenv`. Keep them out of source control.
- **Ports:**
  - Local dev: backend `8000`, frontend `5173`
  - Docker: backend `8000`, frontend `3000` (Nginx), PostgreSQL `5432`
- **Docker** is the easiest way to run the full stack — just `docker compose up --build`.
