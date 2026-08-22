# Tripora

**Plan the trip, not the spreadsheet.**

<p align="center">
  <a href="https://react.dev"><img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB" /></a>
  <a href="https://nodejs.org"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white" /></a>
  <a href="https://expressjs.com"><img alt="Express" src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" /></a>
  <a href="https://www.mongodb.com"><img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" /></a>
  <a href="https://www.python.org"><img alt="Python" src="https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=FFD43B" /></a>
  <a href="https://fastapi.tiangolo.com"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" /></a>
</p>

<p align="center">
  <a href="https://vite.dev"><img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" /></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" /></a>
  <a href="https://reactrouter.com"><img alt="React Router" src="https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white" /></a>
  <a href="https://zustand-demo.pmnd.rs"><img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-433E38?style=flat-square" /></a>
  <a href="https://zod.dev"><img alt="Zod" src="https://img.shields.io/badge/Zod-v3_%7C_v4-3E67B1?style=flat-square&logo=zod&logoColor=white" /></a>
  <a href="https://mongoosejs.com"><img alt="Mongoose" src="https://img.shields.io/badge/Mongoose-8-880000?style=flat-square" /></a>
</p>

<p align="center">
  <a href="https://groq.com"><img alt="Groq" src="https://img.shields.io/badge/Groq-LPU_Inference-F55036?style=flat-square" /></a>
  <a href="https://ai.google.dev"><img alt="Gemini" src="https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" /></a>
  <a href="https://www.langchain.com/langgraph"><img alt="LangGraph" src="https://img.shields.io/badge/LangGraph-0.2-1C3C3C?style=flat-square" /></a>
  <a href="https://jwt.io"><img alt="JWT" src="https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" /></a>
  <a href="https://cloudinary.com"><img alt="Cloudinary" src="https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white" /></a>
</p>

<p align="center">
  <img alt="Hackathon" src="https://img.shields.io/badge/Hackathon-Odoo-c2703f?style=flat-square" />
  <img alt="Team" src="https://img.shields.io/badge/Team-LDCE-2e4034?style=flat-square" />
  <img alt="Status" src="https://img.shields.io/badge/Status-Active_Development-2e4034?style=flat-square" />
</p>

Multi-city travel itinerary planner. Built for the Odoo Hackathon by Team LDCE.

Plan a trip across several cities, give each city a date range and a budget, hang
activities off each day, and watch the cost roll up per day, per city, and per
category. Generate a first draft with AI instead of starting blank, ask a
travel-savvy assistant questions about the trip you're building, and publish a
finished itinerary to a public URL that anyone can view and copy onto their own
account.

**The core loop:** sign up → create a trip → add city stops → add activities →
watch the budget update live → share a public link → someone else copies it.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Data Model](#data-model)
9. [Conventions & Gotchas](#conventions--gotchas)
10. [Design Language](#design-language)

---

## Features

**Trip planning**
- Multi-city trips: each stop is a city with its own date range, transport cost,
  accommodation cost, and per-day meal budget
- A searchable catalog of cities and activities, seeded with 30 cities across 6
  regions and 180 activities
- Drag-free reordering endpoints for both stops and the activities inside a day
- Custom, off-catalog activities alongside catalog ones

**Budgeting**
- Every number on the budget screen — category totals, per-stop totals, daily
  spend, the overbudget flag — is computed server-side in one place
  (`budget.service.js`), so the pie chart, the sticky builder bar, and the
  dashboard total can never disagree
- Costs break down by transport, stay, meals, and activities, both per stop and
  per day
- An optional budget limit drives an even daily allowance and flags the days
  (and the trip as a whole) that exceed it

**AI, two different ways**
- **AI trip generator** (`/trips/ai`) — describe a trip in a sentence and get
  back a complete, fully editable trip with real stops and activities already
  written to the database. Backed by Groq or Gemini, whichever key is configured
  on the server.
- **Ask Triplie** — a floating assistant on every screen, backed by a standalone
  LangGraph service. It classifies each message as conversation or a planning
  request, answers general questions directly, and grounds trip suggestions in
  the real city/activity catalog — never inventing a destination the database
  doesn't have. It also reads whatever trip you're currently viewing, so "am I
  over budget in Kyoto?" gets a real answer. It understands English and the ten
  Indic languages Sarvam supports, and degrades to an offline notice rather than
  an error when the service isn't running.

**Sharing & community**
- Publish a trip to a short, unguessable public URL (`/t/:slug`) that strips all
  owner PII and works for someone with no account
- "Copy Trip" clones a published itinerary into another account in one call
- A community feed of public trips, sortable by recency or view count

**Accounts & admin**
- JWT auth (short-lived access token + httpOnly refresh cookie) with silent
  refresh on 401
- Profile editing, avatar upload, saved destinations, password change, account
  deletion
- An admin dashboard with platform stats, popular cities/activities, and signup
  trends, gated on both the client and the server

---

## Architecture

Three independent services, each with its own runtime and its own reason to
exist separately:

```
frontend/   React + Vite            talks to backend/ and, optionally, AI/
backend/    Node + Express + Mongo  the system of record — auth, trips, budget, catalog
AI/         Python + FastAPI        the Ask Triplie assistant (LangGraph + Groq + Sarvam)
```

`backend/` is the only service with write access to the core collections
(`users`, `trips`, `stops`, `tripActivities`, `cities`, `activities`) and the
only one the frontend depends on for the app to function at all. `AI/` reads
that same MongoDB database read-only for grounding and writes only to its own
`ai_suggestion_logs` collection — it ships and iterates independently, and the
app works completely normally with it turned off. The AI trip generator is a
third path, but it isn't a separate service: it's a Groq/Gemini call made from
inside `backend/`, gated behind `GET /ai/status` so the client can hide the
entry point rather than offer a button that always fails.

---

## Tech Stack

| Service | Layer | Choice |
| --- | --- | --- |
| **Frontend** | Framework | React 19 + Vite 8 |
| | Routing | react-router-dom v7 |
| | Styling | Tailwind CSS v4 (`@tailwindcss/vite` — no `tailwind.config.js`; tokens live in `@theme` in `index.css`) |
| | Client state | Zustand |
| | Forms & validation | react-hook-form + zod v4 |
| | Icons | lucide-react |
| **Backend** | Runtime | Node 20+ (ESM), Express 4 |
| | Database | MongoDB + Mongoose 8 |
| | Auth | JWT (access + refresh) + bcryptjs |
| | Validation | zod v3, via a `validate(schema)` middleware — the only input validation in the app |
| | Uploads | Cloudinary + multer (memory storage, no disk writes) |
| | AI providers | Groq (`openai/gpt-oss-120b`, OpenAI-compatible) and/or Gemini (`gemini-2.5-flash`), behind one interface |
| **AI service** | Framework | Python 3.11+, FastAPI + Uvicorn |
| | Orchestration | LangGraph (`StateGraph`) |
| | Models | Groq (`openai/gpt-oss-20b`) via `langchain-openai`; Sarvam AI for language ID |
| | Database | Motor (async MongoDB driver), read-only against the same cluster |

---

## Project Structure

```
backend/src/
  config/        env.js (the only place process.env is read), db.js, cloudinary.js
  models/        User, City, Activity, Trip, Stop, TripActivity
  controllers/   one per resource, thin, wrapped in asyncHandler
  services/      budget.service, itinerary.service, ai.service, llm.service (+ groq/gemini transports)
  validators/    zod v3 request schemas
  middleware/    auth, validate, error, upload, rateLimit
  routes/        index.js mounts everything under /api/v1
  utils/         ApiError, apiResponse, asyncHandler, dates, escapeRegex
  seed/          cities.json, activities.json, seed.js, fetchImages.js, mirrorImages.js

frontend/src/
  api/           one module per resource; each unwraps the { success, data, message } envelope
  components/    ui/ (primitives) · layout/ · landing/ · dashboard/ · trip/ · ai/
  hooks/         fetch-on-key-change hooks — there is no query library
  lib/           constants, dates, format, validation (zod v4), env, cn
  pages/         one folder per screen (Landing, Trips, CreateTrip, AiTrip, TripBuilder,
                 TripBudget, TripView, Cities, Activities, Community, PublicTrip, Profile, Admin)
  store/         authStore.js (zustand)

AI/app/
  main.py            FastAPI app + CORS
  config.py          pydantic-settings, env-driven
  db.py              Motor client — reads cities/activities/trips/stops
  sarvam_client.py   language identification
  groq_client.py     chat completion for suggestion generation
  routes/            POST /api/v1/suggestions, GET /api/v1/health
  graph/             state.py, nodes.py, build.py — the LangGraph pipeline
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB connection string (Atlas or local)
- Python 3.11+ (only if you want to run the Ask Triplie service)

### 1 — Backend (`http://localhost:5000`)

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI + both JWT secrets, at minimum
npm run seed               # loads 30 cities, 180 activities, and two demo accounts
npm run dev
```

`npm run seed` is idempotent — safe to re-run any time. Two optional scripts
fetch real photos for the catalog instead of the UI's gradient fallback:
`npm run seed:images` (downloads and rewrites `imageUrl`) and
`npm run seed:images:mirror` (re-hosts them).

### 2 — Frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

No `.env` is required for local development — Vite proxies `/api` to
`http://localhost:5000`, and the AI service URL defaults to
`http://localhost:8000`. Copy `.env.example` to `.env` only if you need to point
at a deployed API or a non-default AI service origin.

### 3 — Ask Triplie (optional, `http://localhost:8000`)

The app works fully without this — the assistant widget just shows an offline
notice. To run it:

```bash
cd AI
python -m venv .venv
.venv\Scripts\activate        # Windows — use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # point MONGO_URI at the SAME database as backend/.env
uvicorn app.main:app --reload --port 8000
```

You'll need a Groq API key (generation) and, optionally, a Sarvam API key
(language identification — without it, input is assumed to be English). See
[`AI/README.md`](AI/README.md) for the full request-flow writeup and a Mermaid
state diagram of the graph.

### Demo accounts

Created by `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@globetrotter.com` | `Admin@123` |
| User | `demo@globetrotter.com` | `Demo@1234` |

Neither account starts with any trips — the seed only loads the catalog and
the two users.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGO_URI` | **Yes** | — | Include the database name before the query string, or writes land in `test` |
| `JWT_ACCESS_SECRET` | **Yes** | — | Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | **Yes** | — | Must be a different value from the access secret |
| `NODE_ENV` | No | `development` | |
| `PORT` | No | `5000` | |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | No | `15m` / `7d` | |
| `CLIENT_URL` | No | `http://localhost:5173` | CORS origin and the refresh cookie's domain |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | No | — | Without all three, upload routes return `503`; everything else still works |
| `CLOUDINARY_FOLDER` | No | `globetrotter` | |
| `UPLOAD_MAX_MB` | No | `5` | |
| `AI_PROVIDER` | No | auto-detect | Forces `gemini` or `groq`; otherwise whichever is configured wins (Gemini first if both are) |
| `AI_TIMEOUT_MS` | No | `30000` | |
| `GROQ_API_KEY` / `GROQ_BASE_URL` / `GROQ_CHAT_MODEL` / `GROQ_REASONING_EFFORT` | No | — / Groq's endpoint / `openai/gpt-oss-120b` / `low` | Enables the AI trip generator on the Groq backend |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | No | — / `gemini-2.5-flash` | Enables the AI trip generator on the Gemini backend |

Without either `GROQ_API_KEY` or `GEMINI_API_KEY`, `GET /ai/status` reports
`available: false` and the frontend hides the AI trip generator's entry point
instead of offering a button that always fails.

### `frontend/.env`

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `/api/v1` (proxied to `:5000` in dev) | Set only when the deployed API is on a different origin |
| `VITE_AI_SERVICE_URL` | No | `http://localhost:8000/api/v1` | Where Ask Triplie looks for the `AI/` service |
| `VITE_UPLOAD_MAX_MB` | No | `5` | Client-side pre-check; keep in sync with the backend's `UPLOAD_MAX_MB` |

### `AI/.env`

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGO_URI` / `MONGO_DB_NAME` | **Yes** | — / `globetrotter` | Point at the **same** cluster and database as `backend/.env` |
| `GROQ_API_KEY` | **Yes** | — | Runs suggestion generation |
| `GROQ_BASE_URL` / `GROQ_CHAT_MODEL` | No | Groq's endpoint / `openai/gpt-oss-20b` | |
| `SARVAM_API_KEY` / `SARVAM_BASE_URL` | No | — / Sarvam's endpoint | Used only for language ID; on any failure (including a missing key) the graph defaults to English rather than failing the request |
| `PORT` | No | `8000` | |
| `CORS_ORIGINS` | No | localhost origins | Comma-separated allowlist |

---

## API Reference

Base URL: `/api/v1`. Every success response is enveloped as
`{ success: true, data, message }`; errors as
`{ success: false, message, errors: [{ field, message }] }` with no `data` key.
Rate limits: 300 req/15min globally, 20 req/15min (successful requests excluded)
on credential endpoints, 5 req/15min per user on AI generation.

### Auth — `/auth`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | — | |
| POST | `/login` | — | Returns `{ user, accessToken }`; sets an httpOnly refresh cookie |
| POST | `/refresh` | cookie | Rotates the access token |
| POST | `/logout` | — | Clears the refresh cookie |
| GET | `/me` | required | |
| POST | `/forgot-password` | — | |
| POST | `/reset-password` | — | |

### Users — `/users` *(all require auth)*

| Method | Path | Notes |
| --- | --- | --- |
| PATCH | `/me` | `.strict()` schema — unknown keys 422 |
| POST | `/me/password` | |
| DELETE | `/me` | |
| GET / POST / DELETE | `/me/saved`, `/me/saved/:cityId` | Saved destinations |
| PATCH / DELETE | `/me/avatar` | Multipart; uploads to / removes from Cloudinary |
| POST | `/me/images?kind=tripCover\|misc` | Multipart → `{ url, publicId, width, height }` |
| DELETE | `/me/images/*` | Wildcard — the Cloudinary `public_id` contains slashes |

### Trips — `/trips` *(all require auth and are ownership-checked; a trip you don't own 404s, not 403s)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | `?status=&visibility=&search=&sort=&page=&limit=`. Each item includes `stopCount`, `nights`, `cityNames`, and an estimated cost breakdown |
| GET | `/summary` | Dashboard totals — declared before `/:tripId` so Express doesn't read the literal as an id |
| POST | `/` | Validates `endDate ≥ startDate` and a ≤365-day span. Optional `cityIds[]` become dated stops in the *same* request |
| GET / PATCH / DELETE | `/:tripId` | PATCH is `.strict()`; DELETE cascades to stops and trip activities |
| PATCH / DELETE | `/:tripId/cover` | Multipart cover photo |
| GET | `/:tripId/budget` | Full breakdown — see [Data Model](#data-model) |
| GET | `/:tripId/itinerary` | Day-by-day array, ready to render |
| POST / DELETE | `/:tripId/share` | Mints / clears `publicSlug` |
| POST | `/:tripId/copy` | Deep-clones the trip into the caller's account |

**Stops** — `/trips/:tripId/stops`: `GET /`, `POST /`, `PATCH /reorder` (body:
`{ orderedIds: [] }`, every stop id on the trip required), `GET /:stopId/days`,
`PATCH /:stopId`, `DELETE /:stopId`.

**Trip activities** — `/trips/:tripId/activities`: `GET /`, `POST /`,
`PATCH /reorder` (one day's ids), `PATCH /:activityId`, `DELETE /:activityId`.
Omitting `cost` or `durationMinutes` on create copies the catalog value;
sending `cost: 0` pins it to zero.

### Catalog — public, no auth

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/cities` | `?search=&country=&region=&sort=&page=` |
| GET | `/cities/popular`, `/cities/:id` | |
| GET | `/activities` | `?city=&type=&maxCost=&maxDuration=&search=&sort=&page=` |
| GET | `/activities/meta`, `/activities/:id` | |

### Public — `/public`, no auth

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/trips` | Community feed of published trips |
| GET | `/trips/:slug` | Read-only itinerary + budget; bumps `viewCount`; response strips owner PII |

### AI — `/ai` *(all require auth)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/status` | `{ available, provider, model, maxDays }` — gate the entry point on this |
| POST | `/generate-trip` | `{ prompt, startDate, days, travelers?, budgetLimit?, currency?, pace? }` → writes a real trip and returns `{ tripId, stopCount, activityCount, generatedInMs }`. Rate-limited to 5/15min per user |

### Admin — `/admin` *(require auth + admin role)*

`GET /stats`, `GET /popular-cities`, `GET /popular-activities`,
`GET /trends`, `GET /users`, `PATCH /users/:id` (role), `DELETE /users/:id`.

### Ask Triplie — separate service, not under `/api/v1`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/suggestions` | `{ prompt, user_id?, trip_id? }` → `{ summary, reply, intent, suggestions, languageCode, scriptCode }`. No auth of its own and no response envelope — the frontend talks to it with a dedicated client, not the one used for `backend/` |
| GET | `/api/v1/health` | `{ status: "ok" }` |

---

## Data Model

```
User 1───∞ Trip 1───∞ Stop ∞───1 City 1───∞ Activity
                       │                        │
                       └──∞ TripActivity ∞──────┘
User ∞───∞ City   (savedDestinations)
```

`TripActivity` is the associative entity between a `Stop` and a catalog
`Activity` — it's a separate collection rather than an array on `Stop` because
it carries its own attributes (date, time, a price *snapshot* since the catalog
can drift, notes, order within the day), and `activity` is nullable so a fully
custom, off-catalog activity can use `customName` instead.

| Collection | Key fields | Notes |
| --- | --- | --- |
| `User` | email, password (bcrypt, `select: false`), role, savedDestinations[] | `fullName` virtual; password never serializes |
| `City` | name, country, region, costIndex, popularity, lat/lng | Seeded catalog; text-indexed on name + country |
| `Activity` | city ref, type, cost, durationMinutes, rating | Seeded catalog; text-indexed on name + description |
| `Trip` | user ref, name, date range, budgetLimit, isPublic, publicSlug, copiedFrom | `status` virtual (`upcoming`/`ongoing`/`completed`) computed from today vs. the date range at UTC day boundaries — never stored |
| `Stop` | trip ref, city ref, order, date range, transportCost, accommodationCost, mealBudgetPerDay | One city leg of a trip |
| `TripActivity` | trip ref, stop ref, activity ref (nullable), date, cost, order | The join entity described above |

None of the derived numbers are stored — they're computed fresh on every read,
in `budget.service.js`:

- `stop.nights = endDate − startDate`
- `stop.total = transport + stay + (mealBudgetPerDay × nights) + Σ activity costs`
- `trip.total = Σ stop totals`; `trip.avgPerDay = total / trip days`
- `dailySpend[date]` — transport lands on the arrival day, stay and meals spread
  evenly across the stop's nights, activities land on their own date — which is
  what powers the daily-spend chart and the overbudget-day flags

---

## Conventions & Gotchas

A few things that aren't obvious from the code on first read:

- **`_id` is the id.** `id` isn't always present — controllers using `.lean()`
  return raw documents with no `id` virtual. Only `Trip`, `Stop`, and `User` set
  `virtuals: true`, and only when returned as full documents.
- **Two date formats ship in the same payload.** `days[].date` and
  `overBudgetDays[]` are `'YYYY-MM-DD'` strings; every other date is a full ISO
  datetime. Dates are normalized to UTC day boundaries server-side.
- **Zod is v3 on the server, v4 in the browser.** Schemas are not portable
  between them.
- **Update schemas are `.strict()`.** An unrecognized key on a PATCH is a `422`,
  not a silent ignore.
- **`warnings` on a stop/activity write is not an error.** The write already
  succeeded; `warnings` flags dates outside the trip range or overlapping
  another stop. Render them — don't throw.
- **Route order matters.** `/trips/summary` is declared before `/trips/:tripId`,
  and `/reorder` before `/:stopId` — a static route below a param route gets
  read as the param.
- **`GET /ai/status` requires auth**, so the AI entry point can't be gated on a
  pre-login screen.

---

## Design Language

Warm paper and deep forest, editorial rather than SaaS. Design tokens live in
`frontend/src/index.css` under Tailwind v4's `@theme` block — there is no
`tailwind.config.js`, and components reference token names (`bg-canvas`,
`text-ink-700`, `border-line`) rather than raw hex values.

- `canvas` is warm off-white, never cold grey; `brand` is a deep forest green
  and the only primary action color; `ember` is a warm terracotta reserved for
  over-budget states, drafts, and destructive actions — never a primary button
- Elevation comes from 1px borders, not shadows — the shadow tokens exist but
  are deliberately faint, so nothing floats off the page
- `PageHeader` owns the photograph behind the navbar, so the top bar reads as
  sitting on the image rather than a strip below it
