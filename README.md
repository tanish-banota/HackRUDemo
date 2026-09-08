# Time Until

A teaching template for a complete deployment pipeline with React/Vite, Node.js/Express, PostgreSQL, Docker, Render, and Vercel.

## Architecture

- `frontend/` - React + Vite client. Deploy to Vercel or serve with Nginx in Docker.
- `backend/` - Express API and PostgreSQL access. Deploy as a Render web service.
- `backend/db/schema.sql` - PostgreSQL schema and migration.
- `docker-compose.yml` - Local PostgreSQL, API, and frontend development stack.
- `render.yaml` - Render Blueprint for the API and managed PostgreSQL database.

## Local development

### Option A: run the full stack with Docker

```bash
docker compose up --build
```

Open `http://localhost:5173`. The API is available at `http://localhost:4000`.

To stop the stack:

```bash
docker compose down
```

### Option B: run services individually

1. Start PostgreSQL and apply `backend/db/schema.sql`.
2. In `backend/`, copy `.env.example` to `.env`, set `DATABASE_URL`, then run `npm install` and `npm run dev`.
3. In `frontend/`, copy `.env.example` to `.env`, set `VITE_API_URL`, then run `npm install` and `npm run dev`.

## Deployment teaching path

1. **Docker:** Build the backend with `docker build -f backend/Dockerfile .` and the frontend with `docker build -f frontend/Dockerfile frontend`.
2. **Render:** Deploy `render.yaml`. Render provisions PostgreSQL and injects `DATABASE_URL` into the API service. Replace the placeholder `CORS_ORIGIN` with the actual Vercel URL after the frontend is deployed.
3. **Vercel:** Import `frontend/` as the project root and set `VITE_API_URL` to the deployed Render API URL, for example `https://time-until-api.onrender.com`.
4. **Verify:** Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health` and confirm it returns `{"status":"ok"}`. Then create a countdown from the Vercel site.
5. **Share:** Send the generated `/c/:id` URL to anyone.

### Deployment checklist

- Push the repository, including both `package-lock.json` files, to GitHub.
- Create the Render Blueprint from `render.yaml` and wait for the database and API to deploy.
- Copy the final Vercel production URL into Render's `CORS_ORIGIN` environment variable, then redeploy the API.
- Set `VITE_API_URL` in Vercel for the Production environment and redeploy the frontend. Vite variables are embedded at build time.
- Do not use a trailing slash in either URL.
- Confirm the browser can create a countdown and open its `/c/:id` route.

## API

- `GET /api/health` - health check.
- `POST /api/countdowns` - create a countdown with `title`, `targetDate`, and optional `themeAccent`.
- `GET /api/countdowns/:id` - retrieve a countdown.

Example request:

```json
{
  "title": "HackRU submission",
  "targetDate": "2026-12-01T17:00:00.000Z",
  "themeAccent": "#f97316"
}
```
