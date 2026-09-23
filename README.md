# Time Until

A small countdown app for creating shareable timers for events, launches, deadlines, trips, or personal milestones. The project is built as a teaching example for a full-stack deployment flow using React, Vite, Express, PostgreSQL, Docker, Render, and Vercel.

## Architecture

- `frontend/` — React + Vite client that creates and displays countdowns.
- `backend/` — Express API with PostgreSQL access.
- `backend/db/schema.sql` — database schema used to initialize the app database.
- `docker-compose.yml` — local development stack for PostgreSQL, API, and frontend.
- `render.yaml` — Render Blueprint for the API service and managed Postgres database.
- `frontend/vercel.json` — rewrites `/c/:id` routes to the SPA entry file.

## Features

- Create a countdown with a title, target date/time, and optional accent color.
- Share a countdown via a unique `/c/:id` URL.
- View a live countdown with days, hours, minutes, and seconds.
- Toggle light/dark theme and choose a custom accent color.
- Final state shows a celebration panel when the target time is reached.

## Local development

### Prerequisites

- Node.js 20+
- Docker Desktop with Docker Compose (recommended)
- PostgreSQL 16+ if you want to run services manually

### Option A: run everything with Docker Compose

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- API: http://localhost:4000

To stop the stack:

```bash
docker compose down
```

### Option B: run services individually

1. Start PostgreSQL and apply the schema:

```bash
createdb countdowns
psql countdowns < backend/db/schema.sql
```

2. Start the backend:

```bash
cd backend
npm install
$env:DATABASE_URL = "postgresql://USER:PASSWORD@localhost:5432/countdowns"
npm run dev
```

Set `DATABASE_SSL=true` only if your database requires SSL.

3. Start the frontend in a second terminal:

```bash
cd frontend
npm install
$env:VITE_API_URL = "http://localhost:4000"
npm run dev
```

`VITE_API_URL` is optional locally because the frontend falls back to `http://localhost:4000` when it is not set.

## Environment variables

### Backend

- `DATABASE_URL` — PostgreSQL connection string
- `DATABASE_SSL` — set to `true` for managed/SSL-enabled databases
- `PORT` — API port, defaults to `4000`
- `CORS_ORIGIN` — comma-separated allowed origins, such as `https://your-app.vercel.app`

### Frontend

- `VITE_API_URL` — base URL for the Express API, used during build and runtime config

## Deployment path

1. Build and test locally with Docker Compose.
2. Deploy the backend to Render using `render.yaml`.
3. Set `CORS_ORIGIN` in Render to the production Vercel URL after the frontend is live.
4. Deploy the frontend to Vercel and set `VITE_API_URL` to the deployed Render API URL.
5. Open the shared `/c/:id` link to confirm the full flow works.

### Render setup

The project includes a Render Blueprint in `render.yaml`.

- It provisions a managed PostgreSQL database.
- It creates the API web service using the Dockerfile in `backend/Dockerfile`.
- It injects `DATABASE_URL` automatically.
- It sets `DATABASE_SSL` to `true` for Render-managed Postgres.

### Vercel setup

Import the `frontend/` folder as the app root in Vercel.

Set the build-time environment variable:

```bash
VITE_API_URL=https://your-render-api-url.onrender.com
```

The frontend project includes a rewrite for `/c/:id` routes in `frontend/vercel.json`, so shared countdown pages work correctly after deployment.

## API

### Health check

```http
GET /api/health
```

Returns:

```json
{ "status": "ok" }
```

### Create a countdown

```http
POST /api/countdowns
```

Body:

```json
{
  "title": "HackRU submission",
  "targetDate": "2026-12-01T17:00:00.000Z",
  "themeAccent": "#f97316"
}
```

Validation rules:

- `title` is required and must be 1–255 characters
- `targetDate` must be a valid ISO timestamp
- `themeAccent` is optional and must be a 6-digit hex color like `#f97316`

Successful response:

```json
{
  "countdown": {
    "id": "Ab12Cd34",
    "title": "HackRU submission",
    "targetDate": "2026-12-01T17:00:00.000Z",
    "themeAccent": "#f97316",
    "createdAt": "2026-09-11T12:00:00.000Z"
  }
}
```

### Get one countdown

```http
GET /api/countdowns/:id
```

Returns the same countdown object wrapped in `countdown`.

If the record is missing, the API returns `404`.
If the request is invalid, it returns `400` with an `error` message.

## Project scripts

### Backend

```bash
cd backend
npm install
npm run dev
npm run check
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Deployment checklist

- Push both `package-lock.json` files to GitHub.
- Deploy the backend from `render.yaml` and wait for the database to initialize.
- Update `CORS_ORIGIN` in Render to the final Vercel production URL.
- Set `VITE_API_URL` in Vercel to the deployed Render API URL.
- Do not include a trailing slash in either URL.
- Verify that the app can create a countdown and open a shareable `/c/:id` page.

## Notes

This project is intentionally designed as a deployment teaching template. The frontend is intentionally simple and focused on the end-to-end flow rather than a complex app architecture.
