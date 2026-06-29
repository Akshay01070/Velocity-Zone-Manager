# Velocity Zone Manager

A production-quality full-stack application for managing velocity zones with interactive map visualization.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript (strict) |
| Maps | OpenLayers |
| Styling | TailwindCSS |
| HTTP | Axios |
| Routing | React Router v6 |
| Backend | Flask + Application Factory Pattern |
| ORM | Flask-SQLAlchemy |
| Auth | JWT (Flask-JWT-Extended) |
| Database | PostgreSQL |
| Container | Docker Compose |

## Project Structure

```
/
├── frontend/          # React + Vite + TypeScript SPA
├── backend/           # Flask REST API
├── docker-compose.yml # Orchestration
└── README.md
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Running with Docker Compose

```bash
# Copy environment files
cp backend/.env.example backend/.env

# Build and start all services
docker compose up --build

# Services will be available at:
#   Frontend  → http://localhost:5173
#   Backend   → http://localhost:5000
#   Postgres  → localhost:5432
```

### Local Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask db init
flask db migrate
flask db upgrade
flask run
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

## API Documentation

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Obtain JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/zones/` | List all velocity zones |
| POST | `/zones/` | Create a velocity zone |
| GET | `/zones/<id>` | Get a single zone |
| PUT | `/zones/<id>` | Update a zone |
| DELETE | `/zones/<id>` | Delete a zone |

## License

MIT

# Velocity-Zone-Manager
