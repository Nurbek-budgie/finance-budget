# Finance Tracker — Backend

Personal finance tracker API built with FastAPI and a Domain-Driven Design architecture. Parses bank statements (KICB Excel / CSV), auto-categorises transactions using keyword rules, and exposes analytics endpoints consumed by the React frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI 0.104.1 |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL 15 |
| Migrations | Alembic 1.12.1 |
| Validation | Pydantic 2.5 |
| Excel parsing | openpyxl 3.1.5 |
| Package manager | Poetry |
| Testing | pytest + httpx |
| Container | Docker / Railway |

---

## Architecture Overview

The project follows DDD layering — domain logic is kept free of framework concerns:

```
backend/
├── app/
│   ├── main.py                            # FastAPI app + CORS + static files
│   ├── config/                            # pydantic-settings config
│   ├── api/v1/
│   │   ├── transactions.py                # Upload, list, staged endpoints
│   │   ├── analytics.py                   # Summary, balance, daily trend, categories
│   │   ├── budgets.py                     # Budget CRUD
│   │   └── tag_rules.py                   # Auto-tagger keyword rule CRUD
│   ├── domain/
│   │   ├── models/                        # Entities: Transaction, Budget, TagRule, …
│   │   ├── repositories/                  # Abstract repository interfaces
│   │   └── services/                      # Business logic: TransactionService, TaggerService, IngestionService
│   └── infrastructure/
│       ├── database/                      # SQLAlchemy ORM models + connection
│       ├── parsers/                       # KICBExcelParser, GenericExcelParser, CSVParser
│       └── persistence/                   # Concrete repository implementations
├── alembic/                               # Database migrations
├── tests/
├── Dockerfile
├── railway.toml
└── pyproject.toml
```

**Layer rules:**
- `domain/` — no SQLAlchemy, no FastAPI, no HTTP
- `infrastructure/` — no business rules
- `api/` — no direct DB queries, no business logic

---

## Ingestion Pipeline

Every file upload flows through this pipeline:

```
Upload .xlsx / .csv
  └─> ParserFactory selects parser (KICB / Generic Excel / CSV)
        └─> list[RawTransaction]
              └─> dedup check via external_id
                    └─> TaggerService matches keyword rules (priority-ordered)
                          confidence >= 0.5  →  committed to transactions table
                          confidence <  0.5  →  staged_transactions (waiting room)
```

- `external_id` — bank operation number from KICB; guards against re-uploading the same statement
- Staged items are reviewed and promoted/rejected via the approve/reject endpoints
- `TAGGER_CONFIDENCE_THRESHOLD` env var controls the commit/stage cutoff (default `0.5`)

---

## API Reference

```
# Transactions
POST   /api/v1/transactions/upload          Upload .xlsx or .csv
GET    /api/v1/transactions                 List (limit/offset, date range)
DELETE /api/v1/transactions/{id}            Delete single transaction

# Waiting room (staged)
GET    /api/v1/transactions/staged          List PENDING staged transactions
POST   /api/v1/transactions/staged/approve  Bulk approve → promote to transactions
POST   /api/v1/transactions/staged/reject   Bulk reject

# Tag rules
GET    /api/v1/tag-rules/                   List all rules
POST   /api/v1/tag-rules/                   Create rule {keyword, category, priority}
DELETE /api/v1/tag-rules/{id}               Delete rule

# Budgets
GET    /api/v1/budgets/                     List budgets
POST   /api/v1/budgets/                     Create budget {category, limit_amount, period}
PUT    /api/v1/budgets/{id}                 Update budget
DELETE /api/v1/budgets/{id}                 Delete budget

# Analytics
GET    /api/v1/analytics/summary            total_income, total_expenses, balance, count
GET    /api/v1/analytics/balance            Current balance
GET    /api/v1/analytics/daily-trend        Daily income/expense breakdown
GET    /api/v1/analytics/categories         Expense breakdown by category

GET    /health
```

Upload response shape:
```json
{
  "committed": 51,
  "staged": 3,
  "skipped_duplicates": 0,
  "errors": []
}
```

Interactive docs available at `http://localhost:8000/docs` when the server is running.

---

## KICB Excel Format

Data starts at **row 12** (rows 1–11 are metadata + bilingual headers).

| Column | Field | Notes |
|---|---|---|
| A | Operation # | `external_id` for deduplication |
| B | Value date | DD.MM.YYYY |
| C | Sender/Beneficiary | Used in tag matching |
| D | Description | Primary tag target |
| E | Amount | Negative = expense, positive = income |
| F | Balance | Ignored |

The `GenericExcelParser` also handles standard exports where row 1 contains headers: `date`, `description`, `amount`, `type`, `category`.

---

## Environment Variables

```bash
DATABASE_URL=postgresql://finance_user:dev_password@localhost:5432/finance_tracker
ENV=development
ALLOWED_ORIGINS=http://localhost:5173
TAGGER_CONFIDENCE_THRESHOLD=0.5   # optional, default 0.5
```

Copy `.env.example` to `.env` and adjust values.

---

## Local Development

**Prerequisites:** Docker, Python 3.11+, Poetry

```bash
# 1. Start PostgreSQL
docker-compose up -d                        # from project root

# 2. Install dependencies
cd backend
poetry install

# 3. Apply migrations
poetry run alembic upgrade head

# 4. Run dev server
poetry run uvicorn app.main:app --reload --port 8000
```

---

## Database Migrations

```bash
# Generate a new migration after editing infrastructure/database/models.py
alembic revision --autogenerate -m "describe the change"

# Review the generated file in alembic/versions/, then apply
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

Never edit the ORM models without generating a migration.

---

## Testing

```bash
poetry run pytest
```

- Domain service tests use mock repositories (no DB required)
- API integration tests use `httpx` + `TestClient` against a real test database (never mock the DB)

---

## Deployment

The app ships as a Docker container and is configured for **Railway** via `railway.toml`. The `entrypoint.sh` runs Alembic migrations before starting Uvicorn, so the schema is always up to date on deploy.

```bash
# Build locally
docker build -t finance-tracker-backend .
docker run -p 8000:8000 --env-file .env finance-tracker-backend
```

Health check endpoint: `GET /health`

---

## Adding a New Feature

1. Add/update the domain entity in `app/domain/models/`
2. Update the abstract repository interface in `app/domain/repositories/`
3. Add business logic in `app/domain/services/`
4. Update the ORM model in `app/infrastructure/database/models.py` and generate a migration
5. Implement the concrete repository in `app/infrastructure/persistence/`
6. Add the API endpoint in `app/api/v1/`