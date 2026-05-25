# CraftLance — Full-Stack Freelance Platform

A professional freelancing platform built with **FastAPI** (Python) + **React** (TypeScript), delivered across 9 milestones and merged into one complete project.

## Features by Milestone

| Milestone | Feature |
|-----------|---------|
| M1 | Auth (JWT), User registration & login, Onboarding flow |
| M2 | Freelancer profiles, Portfolio items, Skill badges, Reputation cards |
| M3 | Post/browse projects, Submit & manage proposals |
| M4 | Contract workspace, Milestone timeline, Real-time messaging |
| M5 | Escrow payments, Payment history, Earnings summary |
| M6 | Review & rating system, Reputation scores |
| M7 | AI-powered proposal scoring (Anthropic Claude) |
| M8 | Skill verification tests, Badge awards |
| M9 | Community directory, Freelancer discovery, Saved freelancers |

---

## Tech Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form, Zod, Framer Motion  
**Backend**: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Python-Jose (JWT), Passlib  
**AI**: Anthropic Claude API (M7 proposal scoring, M8 skill tests)

---

## Quick Start (Docker)

```bash
# 1. Clone / unzip the project
cd craftlance

# 2. Add your Anthropic API key (optional — needed for M7/M8)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:5173
# Backend  → http://localhost:8000
# API Docs → http://localhost:8000/docs
```

---

## Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, ANTHROPIC_API_KEY

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
craftlance/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # All API endpoints
│   │   │   ├── auth.py          # M1 — JWT auth
│   │   │   ├── users.py         # M1 — User CRUD
│   │   │   ├── portfolio.py     # M2 — Portfolio
│   │   │   ├── skills.py        # M2 — Skills
│   │   │   ├── projects.py      # M3 — Projects
│   │   │   ├── proposals.py     # M3 — Proposals
│   │   │   ├── contracts.py     # M4 — Contracts & workspace
│   │   │   ├── payments.py      # M5 — Payments & escrow
│   │   │   ├── reviews.py       # M6 — Reviews & ratings
│   │   │   ├── ai.py            # M7 — AI proposal scoring
│   │   │   ├── skills_verification.py  # M8 — Skill tests
│   │   │   └── community.py     # M9 — Freelancer directory
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   │   ├── ai_scorer.py     # M7 — Anthropic integration
│   │   │   ├── skill_catalogue.py  # M8 — Test questions
│   │   │   └── skill_sessions.py   # M8 — Session management
│   │   └── core/                # Config, DB, Security
│   └── alembic/versions/        # DB migrations (0001→m9)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── landing/         # M1 — Landing page
        │   ├── auth/            # M1 — Login, Register, Onboarding
        │   ├── dashboard/       # M1-M9 — All dashboard pages
        │   ├── projects/        # M3-M4 — Browse, Post, Detail, Edit
        │   ├── workspace/       # M4-M5 — Contract workspace
        │   ├── community/       # M9 — Freelancer directory
        │   └── FreelancerProfile.tsx  # M9 — Public profile
        ├── components/
        │   ├── auth/            # ProtectedRoute
        │   ├── layout/          # Navbar, Sidebar, PageWrapper
        │   ├── profile/         # M2 — Portfolio, Skill badges
        │   ├── projects/        # M3 — Project & Proposal cards
        │   ├── workspace/       # M4-M5 — Messages, Milestones, Escrow
        │   ├── reviews/         # M6 — Review UI
        │   ├── proposals/       # M7 — AI feedback, Score ring
        │   ├── skills/          # M8 — Skill tests, Badges
        │   └── community/       # M9 — Freelancer cards, Filters
        ├── api/                 # Axios API clients
        ├── store/               # Zustand state stores
        └── types/               # TypeScript types
```

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://craftlance:craftlance@localhost:5432/craftlance
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-...   # Required for M7 AI scoring and M8 skill tests
APP_NAME=CraftLance
```

### Frontend `.env` (optional)

```env
VITE_API_URL=http://localhost:8000
```

---

## Database Migrations

Migrations run in order:

```
0001 — Users, Skills, Portfolio, Notifications
0002 — Projects, Proposals
0003 — Contracts, Milestones, Messages
0004 — Payments
0005 — Reviews
0006 — Skill Verifications
m9   — Saved Freelancers (Community)
```

Run all: `alembic upgrade head`  
Roll back one: `alembic downgrade -1`

---

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## License

MIT
