# Finance Tracker

A personal finance tracker that parses bank statements, auto-categorises transactions, and visualises spending over time.

---

## Features

- Upload KICB Excel exports or generic CSV bank statements
- Auto-tags transactions by keyword rules you define
- Low-confidence transactions go into a staged review queue — approve or reject before committing
- Dashboard with KPI cards (income, expenses, balance), calendar heatmap of daily spend, and category breakdown
- Set monthly budgets per category with progress bars
- Filter, paginate, and delete transactions from a full transaction table

---

## Architecture

```
┌──────────────────────┐        REST API        ┌──────────────────────┐
│  frontend/           │ ─────────────────────► │  backend/            │
│  React + TypeScript  │      port 8000          │  FastAPI + SQLAlchemy│
│  Vite (port 5173)    │                         │  DDD architecture    │
└──────────────────────┘                         └──────────┬───────────┘
                                                            │ SQL
                                                   ┌────────▼────────┐
                                                   │  PostgreSQL 15  │
                                                   │  (port 5432)    │
                                                   └─────────────────┘
```

---

## Quick Start

**Prerequisites:** Node 20+, Python 3.11+, Poetry, Docker

```bash
# 1. Start the database
docker compose up -d

# 2. Start the backend (new terminal)
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload

# 3. Start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**  
API docs at **http://localhost:8000/docs**

---

## Deployment

| Service  | Platform                        |
|----------|---------------------------------|
| Backend  | Railway (`backend/railway.toml`) |
| Frontend | Vercel / any static host        |
| Database | Railway managed Postgres        |

---

## Docs

- [Backend README](backend/README.md) — API reference, architecture, environment variables, migrations
- [Frontend README](frontend/README.md) — component structure, state management, design system, routes
