# Velocity Zone Manager (VZM)

> A full-stack web application for managing geographic zones on physical properties (golf courses, airports, corporate campuses). Draw, classify, and monitor autonomous-mower deployment zones on an interactive map.


---

## Architecture

VZM follows a **three-tier, service-oriented** architecture with a clean separation of concerns across every layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                         │
│   React 19 + Vite · React Router v7 · OpenLayers · TanStack   │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP / REST (Bearer JWT)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Flask REST API (Python)                       │
│   Blueprints → Routes → Services → Repositories → SQLAlchemy   │
└────────────────────────────┬────────────────────────────────────┘
                             │  psycopg2 / SQLAlchemy ORM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               PostgreSQL 16   (JSONB geometry)                   │
│         users · properties · zones  (3 core tables)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Concern | Technology | Version |
|---|---|---|
| Web framework | Flask | 3.0.3 |
| ORM | SQLAlchemy + Flask-SQLAlchemy | 2.0.30 / 3.1.1 |
| Migrations | Alembic + Flask-Migrate | 1.13.1 / 4.0.7 |
| Auth | Flask-JWT-Extended | 4.6.0 |
| CORS | Flask-CORS | 4.0.1 |
| Validation | Marshmallow | 3.21.3 |
| DB driver | psycopg2-binary | 2.9.9 |
| App server | Gunicorn | 22.0.0 |
| Database | PostgreSQL | 16 (Alpine) |
| Runtime | Python | 3.11 |

### Frontend

| Concern | Technology | Version |
|---|---|---|
| UI framework | React | 19 |
| Language | TypeScript | ~6.0 (strict mode) |
| Build tool | Vite | 8 |
| Routing | React Router DOM | v7 |
| Data fetching | TanStack React Query | v5 |
| HTTP client | Axios | 1.x |
| Map engine | OpenLayers | 10 (no wrapper libraries) |
| Styling | Tailwind CSS | v4 |

No UI component libraries are used for the map. No Leaflet, Mapbox, or Google Maps dependencies exist anywhere in the codebase.

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (or Docker)

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
flask db upgrade
python seed.py
flask run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:5000


## Docker

The application is fully containerized using Docker Compose.

Start the application:

```bash
docker compose up --build
```

This command starts:

| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| Flask API | 5000 |
| React Frontend | 5173 |

On startup the backend automatically:

- waits for PostgreSQL
- runs database migrations
- seeds demo data
- starts the Flask application


## API Endpoints

**Base URL**

```
http://localhost:5000/api/v1
```

### Authentication
- `POST /auth/signup`
- `POST /auth/login`

### Properties
- `GET /properties`
- `GET /properties/:id`
- `POST /properties`
- `PUT /properties/:id`
- `DELETE /properties/:id`

### Zones
- `GET /properties/:id/zones`
- `POST /properties/:id/zones`
- `PUT /properties/:id/zones/:zone_id`
- `DELETE /properties/:id/zones/:zone_id`
- `GET /properties/:id/zones/summary`
- `POST /properties/:id/zones/import`
- `GET /properties/:id/zones/export`

All protected endpoints require JWT authentication.

## Database Design

The application uses three core entities with a one-to-many relationship:

```text
User
 └── Property
       └── Zone
```

### User
- Stores authentication information.
- A user can own multiple properties.

### Property
- Represents a physical location (Golf Course, Airport, Corporate Campus, or Other).
- Contains metadata such as name, type, total acreage, and notes.
- Belongs to a single user.

### Zone
- Represents a mowing zone within a property.
- Stores:
  - Name
  - Type
  - Status
  - Mower Count
  - GeoJSON Geometry (JSONB)
- Belongs to a single property.

**Notes**

- Polygon geometry is stored as **JSONB** in PostgreSQL.
- Zone area is computed from the stored geometry and is **not persisted** in the database.
- The `understaffed` flag is computed dynamically using the business rule:

```
understaffed = zone_area > (mower_count × 2)
```

## Why JSONB Instead of PostGIS

Zone geometry is stored as **PostgreSQL JSONB** rather than **PostGIS**.

I chose JSONB because:

- OpenLayers already produces GeoJSON, allowing geometry to be stored without conversion.
- The assessment does not require advanced spatial queries such as `ST_Intersects` or `ST_Within`.
- JSONB keeps the Docker setup simple by avoiding additional PostGIS dependencies.
- It is sufficient for storing, importing, exporting, and rendering GeoJSON polygons required for this assignment.

If the application needed large-scale spatial querying, overlap detection, or spatial indexing, migrating to PostGIS would be the preferred solution.
---

## Zone Validation & Coverage Rules

The application implements the following business rules:

- A zone cannot be created or updated with `mower_count = 0`. The API returns **HTTP 400** with an appropriate validation message.
- Zone area is calculated from the stored GeoJSON polygon rather than the property's `total_acreage`.
- A zone is considered **understaffed** when:

```
zone_area > mower_count × 2
```

- The `understaffed` value is computed dynamically and is not stored in the database.
- The summary endpoint aggregates total zones, total area, total mowers, and understaffed zone count.
---

## Map Behaviour

- Existing properties automatically zoom to the extent of their saved zones.
- Properties without zones default to a map centered on India.
- Zones can be drawn, edited, and deleted directly on the map.
- Polygon changes are persisted to the database and remain available after page refresh.

## AI Workflow

The project was developed with the assistance of multiple AI tools. AI was primarily used to accelerate scaffolding, generate boilerplate code, suggest project architecture, and assist with debugging. All generated code was manually reviewed, tested, and modified where necessary to satisfy the assessment requirements.

### Q1. Which AI tool(s) did you use, and what specifically did you use each one for?

**Cursor**
- Generated the initial project structure for both the React frontend and Flask backend.
- Scaffolded Flask Application Factory architecture.
- Generated SQLAlchemy models, authentication routes, CRUD APIs, and Docker configuration.
- Assisted with OpenLayers integration, GeoJSON handling, and API implementation.
- Helped refactor code into services, routes, and reusable components.

**GitHub Copilot**
- Used for inline code completion while implementing React components, Flask routes, and utility functions.
- Assisted with repetitive CRUD operations, TypeScript interfaces, and SQLAlchemy model definitions.
- Suggested small code improvements and reduced repetitive typing during development.

**CloudAI**
- Used to generate UI layouts, reusable React components, and improve the overall dashboard structure.
- Helped create forms, cards, dialogs, and responsive layouts for the Property and Zone management pages.
- Assisted with refining frontend interactions and improving user experience.

AI-generated code was never merged blindly. Every generated implementation was reviewed, modified when necessary, and tested before being integrated into the project.

---

### Q2. Give one concrete example of AI output you accepted with no changes.

**Prompt**

```text
Implement JWT authentication.

Endpoints:

POST /auth/signup
POST /auth/login

Passwords must be hashed.

Generate JWT access token.

Protect all future /properties routes.

Return proper HTTP status codes.

Use Flask-JWT-Extended.

Create auth blueprint.

Implement validation.

Do not build frontend.
```

**Output used as-is**

The generated authentication scaffold matched the project requirements and included:

- Authentication blueprint
- Password hashing
- JWT token generation
- Protected route middleware
- Proper HTTP status codes
- Flask-JWT-Extended integration

The generated structure required only project-specific configuration changes and was adopted without any significant logic changes.

---

### Q3. Give one concrete example of AI output you rejected or significantly edited.

**Prompt**

```text
Implement Zone CRUD.

Endpoints:

GET /properties/:id/zones
POST /properties/:id/zones
PUT /properties/:id/zones/:zone_id
DELETE /properties/:id/zones/:zone_id

Zone fields:

name
type
status
mower_count
geometry

Create zone_service.py.

Do not implement GeoJSON import/export yet.

Use the service layer.
```

**What was wrong / what you changed**

The initial AI-generated implementation focused only on basic CRUD functionality.

After comparing it with the assessment requirements, several important business rules were missing or required modification, including:

- Validation that `mower_count` cannot be zero.
- Returning HTTP 400 with the required validation message.
- Computing the `understaffed` flag instead of storing it in the database.
- Ensuring polygon geometry remained the source of truth for zone data.
- Refactoring duplicated validation logic into a shared service function used by both create and update operations.

These changes were implemented manually to satisfy the assignment requirements.

---

### Q4. Name one part of this task where AI was not useful and you did it yourself. Why wasn't AI the right tool there?

The OpenLayers map integration required the most manual work.

Although AI generated the initial map setup and drawing interactions, integrating polygon drawing, editing, GeoJSON conversion, map state management, backend synchronization, and debugging interaction conflicts required manual implementation and testing.

Many issues only became apparent while interacting with the application in the browser, such as draw/edit interaction conflicts, layer updates after saving, map viewport fitting, and synchronizing polygon changes with backend data. These problems required iterative debugging and verification rather than relying solely on AI-generated code.
