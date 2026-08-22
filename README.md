# 🌍 GlobeTrotter — Empowering Personalized Travel Planning

> Odoo Hackathon submission — **Team LDCE**
> A multi-city trip planner: build day-wise itineraries, auto-estimate budgets, visualize timelines, and share plans publicly.

**This document is the build plan.** It defines the stack, data model, API surface, screen-by-screen scope, and the execution order. Build in the order given in [§10 Execution Plan](#10-execution-plan-hackathon-timeline).

### 📍 Current status

| Area | State |
| --- | --- |
| Backend skeleton (config, models, middleware, controllers, routes, seed) | ✅ done |
| Auth API — register / login / refresh / logout / me / forgot / reset | ✅ done & smoke-tested |
| City catalog API + 30 seeded cities + demo accounts | ✅ done |
| Frontend shell — theme tokens, UI kit, routing, Zustand auth store | ✅ done |
| **9.1** Login & Signup screens | ✅ done |
| **9.2** Landing page (hero, destinations, how-it-works, budget preview, CTA) | ✅ done |
| Everything else in §9 | ⬜ next — routed to an honest `ComingSoon` placeholder so no link dead-ends |

Sign in with the seeded accounts: `demo@globetrotter.com / Demo@1234` · `admin@globetrotter.com / Admin@123`

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Repository Structure](#3-repository-structure)
4. [Data Model](#4-data-model)
5. [API Surface](#5-api-surface)
6. [Auth & Security Plan](#6-auth--security-plan)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Design System (Tailwind)](#8-design-system-tailwind)
9. [Screen-by-Screen Plan](#9-screen-by-screen-plan)
10. [Execution Plan (Hackathon Timeline)](#10-execution-plan-hackathon-timeline)
11. [Seed Data Strategy](#11-seed-data-strategy)
12. [Environment & Setup](#12-environment--setup)
13. [Deployment](#13-deployment)
14. [Demo Script](#14-demo-script)
15. [Scope Guardrails](#15-scope-guardrails)

---

## 1. Product Summary

A traveler signs up, creates a **Trip** (name + date range + cover photo), then adds **Stops** — each stop is a city with its own date range. Inside each stop they attach **Activities** (sightseeing, food, adventure…) picked from a searchable catalog, each with a cost and duration. The app continuously recomputes the **budget breakdown** (transport / stay / activities / meals), renders the plan as a **day-wise timeline and calendar**, and can publish a **read-only public URL** that anyone can view and "Copy Trip" from.

**Core loop we must nail for the demo:**
`Signup → Create Trip → Add 2–3 city stops → Add activities → See budget chart update → See calendar/timeline → Share public link → Another user copies the trip.`

Everything else (community tab, admin analytics, i18n) is a bonus that only gets built once the core loop is bulletproof.

---

## 2. Tech Stack & Why

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | **React 19 + Vite 8** | Instant HMR; far faster than CRA for a timed build |
| Routing | **react-router-dom v6** | Nested layouts + protected route wrappers |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Required by the brief. v4 means design tokens live in `@theme` inside `index.css` — there is no `tailwind.config.js` |
| Icons | **lucide-react** | One consistent icon set, tree-shaken |
| Server state | **TanStack Query** *(added with trip data)* | Caching and refetch. Auth + catalog reads are thin enough to run on plain hooks today |
| Client state | **Zustand** | `authStore` today; `builderStore` for the itinerary draft next |
| Forms | **react-hook-form + zod** | Shared zod schemas between client and server validation |
| Charts | **Recharts** | Pie + bar for the budget screen, ~5 lines each |
| Calendar | **react-big-calendar** (or a hand-rolled month grid) | Screen 11 needs a month view with trip chips |
| Drag & drop | **@dnd-kit/core** | Reorder stops and activities |
| Dates | **date-fns** | Lightweight day math for itinerary generation |
| Backend | **Node 20 + Express 4** | Fastest path to a REST API the whole team knows |
| Database | **MongoDB Atlas + Mongoose 8** | Free hosted cluster, no local setup friction for teammates |
| Auth | **JWT (access + refresh) + bcrypt** | Stateless, simple to demo |
| Uploads | **Cloudinary** (multer memory storage) | Cover photos and avatars without touching the host filesystem |
| Validation | **zod** on both sides | One schema, two consumers |
| Deploy | **Vercel** (frontend) + **Render** (API) + **Atlas** (DB) | All free tiers, all deploy from git |

### ⚠️ On "relational database"

The brief asks for *"proper use of relational databases."* We use MongoDB but model it **relationally, not as one fat nested document**:

- Separate collections: `users`, `trips`, `stops`, `activities`, `tripActivities`, `cities`, `expenses`
- Real foreign keys via `ObjectId` refs with `populate()`
- `tripActivities` is an explicit **join collection** between a stop and a catalog activity, carrying its own attributes (date, time, cost override, notes) — a textbook associative entity
- Indexes on every FK plus text indexes on `cities.name` / `activities.name`
- An **ER diagram** goes in `/docs/er-diagram.png` and gets shown during judging

If a judge insists on SQL, the fallback is Postgres + Prisma — the schema in §4 maps 1:1. **Do not attempt this switch mid-hackathon.**

---

## 3. Repository Structure

`✅` exists today · `⬜` planned.

```
ODOO-LDCE/
├── README.md
├── .gitignore                     ✅ keeps .env out of git
├── backend/
│   ├── .env / .env.example        ✅
│   └── src/
│       ├── config/                ✅ env.js, db.js            ⬜ cloudinary.js
│       ├── models/                ✅ User, City, Activity, Trip, Stop, TripActivity, index.js
│       ├── middleware/            ✅ auth, validate, error, rateLimit
│       ├── validators/            ✅ auth.validator.js        ⬜ trip, stop, activity
│       ├── controllers/           ✅ auth, city               ⬜ trip, stop, user, admin
│       ├── services/              ✅ token.service.js         ⬜ budget, itinerary, copyTrip
│       ├── routes/                ✅ index, auth, city        ⬜ trip, stop, public, admin
│       ├── utils/                 ✅ ApiError, apiResponse, asyncHandler
│       ├── seed/                  ✅ cities.json (30), seed.js
│       ├── app.js  server.js      ✅
│       └── package.json           ✅
└── frontend/
    ├── .env / .env.example        ✅
    └── src/
        ├── index.css              ✅ @theme design tokens (Tailwind v4)
        ├── api/                   ✅ client.js (axios + silent refresh), auth.api.js, city.api.js
        ├── store/                 ✅ authStore.js             ⬜ builderStore.js
        ├── lib/                   ✅ cn.js, constants.js, validation.js
        ├── hooks/                 ✅ usePageTitle, usePopularCities
        ├── components/
        │   ├── ui/                ✅ Button, Input/PasswordInput/TextArea, Field,
        │   │                         Alert, Badge, Logo, AvatarUpload, Spinner
        │   ├── layout/            ✅ Navbar, Footer, MainLayout, RouteGuards, ScrollToTop
        │   ├── auth/              ✅ AuthLayout
        │   ├── landing/           ✅ Hero, HeroScene, CityCard, DestinationRail,
        │   │                         HowItWorks, BudgetPreview, CtaBand
        │   ├── trip/              ⬜ TripCard, StopCard, ActivityCard, BudgetBar
        │   └── charts/            ⬜ BudgetPie, BudgetBar, DailySpendLine
        ├── pages/                 ✅ Landing, Login, Register, ComingSoon, NotFound
        ├── routes.jsx  App.jsx  main.jsx  ✅
        └── package.json           ✅
```

**Module conventions**
- **Backend:** a route file only wires middleware to a controller; controllers never touch `res.json` directly (they call `sendSuccess`/`sendCreated`); anything reusable across controllers becomes a `service`. No controller reads `process.env` or `req.body` unvalidated.
- **Frontend:** pages compose components, components compose `ui/` primitives. Only `api/` talks to axios, only `store/` holds cross-page state, and every colour/spacing value comes from a token in `index.css`.

**Team split:** one person owns `backend/`, one owns auth + trip CRUD screens, one owns the itinerary builder + budget + calendar, one owns search/public/admin + polish. Agree on the API contract in §5 **before** anyone writes code so nobody blocks.

---

## 4. Data Model

### `User`
```js
{
  firstName, lastName,
  email,     // unique, lowercased, indexed
  password,  // bcrypt hash, select:false
  phone, city, country, bio,
  avatarUrl,
  role,              // 'user' | 'admin'
  languagePref,      // 'en' default
  savedDestinations: [ObjectId → City],
  resetPasswordToken, resetPasswordExpires,
  timestamps
}
```

### `City` (catalog, seeded)
```js
{
  name, country, region,
  costIndex,      // 1–100, drives budget suggestions
  popularity,     // 1–100, drives "Top Regional Selections"
  imageUrl, description,
  latitude, longitude,
  currency
}
// index: { name: 'text', country: 'text' }, { country: 1 }, { popularity: -1 }
```

### `Activity` (catalog, seeded, belongs to a City)
```js
{
  city: ObjectId → City,
  name, description, imageUrl,
  type,            // 'sightseeing' | 'food' | 'adventure' | 'culture' | 'nightlife' | 'relaxation' | 'shopping'
  cost,            // in base currency
  durationMinutes,
  rating
}
// index: { city: 1, type: 1 }, { name: 'text' }, { cost: 1 }
```

### `Trip`
```js
{
  user: ObjectId → User,
  name, description,
  startDate, endDate,
  coverPhotoUrl,
  budgetLimit,       // optional; powers the overbudget alerts
  currency,          // 'USD' default
  isPublic,          // boolean
  publicSlug,        // nanoid, unique sparse index
  copiedFrom: ObjectId → Trip,   // provenance for "Copy Trip"
  viewCount,
  timestamps
}
// index: { user: 1, startDate: -1 }, { publicSlug: 1 }
// virtual: stops (populate), status ('upcoming'|'ongoing'|'completed' from dates vs today)
```

### `Stop` — one city leg of a trip
```js
{
  trip: ObjectId → Trip,
  city: ObjectId → City,
  order,             // 0-based, drives reordering
  startDate, endDate,
  notes,
  transportCost,     // to reach this stop
  accommodationCost, // for the whole stay
  mealBudgetPerDay
}
// index: { trip: 1, order: 1 }
```

### `TripActivity` — the join / associative entity
```js
{
  trip: ObjectId → Trip,          // denormalized for fast trip-wide queries
  stop: ObjectId → Stop,
  activity: ObjectId → Activity,  // nullable → allows fully custom activities
  customName,                     // used when activity is null
  date,                           // the specific day it happens
  startTime,                      // 'HH:mm'
  durationMinutes,
  cost,                           // snapshot; catalog price may drift
  notes,
  order                           // within its day
}
// index: { trip: 1, date: 1, order: 1 }, { stop: 1 }
```

### `Expense` (optional, for extra budget granularity)
```js
{ trip, stop, category /* transport|stay|activities|meals|other */, label, amount, date }
```

### Relationship map
```
User 1───∞ Trip 1───∞ Stop ∞───1 City 1───∞ Activity
                       │                        │
                       └──∞ TripActivity ∞──────┘
User ∞───∞ City (savedDestinations)
Trip 1───∞ Expense
```

### Derived values (never stored, always computed in `budget.service.js`)
- `stop.nights = differenceInDays(endDate, startDate)`
- `stop.activityTotal = Σ tripActivity.cost` for that stop
- `stop.mealTotal = mealBudgetPerDay × nights`
- `trip.total = Σ (transport + accommodation + meals + activities)` across stops
- `trip.avgPerDay = total / trip nights`
- `dailySpend[date]` → powers the overbudget-day alerts and the line chart

---

## 5. API Surface

Base: `/api/v1`. Every response wraps as `{ success, data, message }`; errors as `{ success:false, message, errors[] }`.

### Auth — `/auth`
| Method | Path | Body / Notes |
| --- | --- | --- |
| POST | `/register` | firstName, lastName, email, password, phone?, city?, country?, bio? |
| POST | `/login` | email, password → `{ user, accessToken }` + httpOnly refresh cookie |
| POST | `/refresh` | rotates access token from the cookie |
| POST | `/logout` | clears the refresh cookie |
| POST | `/forgot-password` | issues a reset token (dev: return it in the response) |
| POST | `/reset-password` | token, newPassword |
| GET | `/me` | current user |

### Users — `/users`
`PATCH /me` (profile) · `PATCH /me/avatar` (multipart) · `DELETE /me` (cascade delete trips) · `POST /me/saved/:cityId` · `DELETE /me/saved/:cityId`

### Trips — `/trips` *(all auth-protected, all ownership-checked)*
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | `?status=ongoing\|upcoming\|completed&search=&sort=&page=` |
| POST | `/` | create; validates end ≥ start |
| GET | `/:id` | full populate: stops → city, tripActivities → activity |
| PATCH | `/:id` | edit basics |
| DELETE | `/:id` | cascades to stops + tripActivities |
| PATCH | `/:id/cover` | multipart cover photo |
| GET | `/:id/budget` | full breakdown + per-day spend + overbudget flags |
| GET | `/:id/itinerary` | day-by-day array, ready to render |
| POST | `/:id/share` | flips `isPublic`, mints `publicSlug` |
| DELETE | `/:id/share` | unpublish |
| POST | `/:id/copy` | deep-clone into the caller's account |

### Stops — `/trips/:tripId/stops`
`GET /` · `POST /` · `PATCH /:stopId` · `DELETE /:stopId` · `PATCH /reorder` (body: `{ orderedIds: [] }`)

### Trip activities — `/trips/:tripId/activities`
`POST /` (attach catalog activity or custom) · `PATCH /:id` · `DELETE /:id` · `PATCH /reorder`

### Catalog — `/cities`, `/activities`
`GET /cities?search=&country=&region=&sort=popularity&page=` · `GET /cities/popular` · `GET /cities/:id` ·
`GET /activities?city=&type=&maxCost=&maxDuration=&search=&sort=&page=`

### Public — `/public` *(no auth)*
`GET /public/trips/:slug` — read-only itinerary + budget summary; bumps `viewCount`
`GET /public/trips` — community feed of published trips

### Admin — `/admin` *(requireAdmin)*
`GET /stats` (users, trips, avg trip length, avg budget) · `GET /popular-cities` · `GET /popular-activities` · `GET /trends?days=30` · `GET /users` · `PATCH /users/:id` (role/ban) · `DELETE /users/:id`

---

## 6. Auth & Security Plan

- **bcrypt**, 10 salt rounds; `password` is `select: false` so it never leaks through a populate
- **Access token** in memory (Zustand), 15-min expiry; **refresh token** in an httpOnly SameSite=Lax cookie, 7 days
- Axios response interceptor: on `401` → hit `/auth/refresh` once → replay the original request → on second failure, log out
- `ProtectedRoute` on the client is UX only; **every controller re-checks `trip.user === req.user.id`** — that check is the actual security boundary
- Public itineraries are exposed only via unguessable `nanoid(12)` slugs and pass through a serializer that strips owner email, phone, and internal IDs
- `helmet`, `cors` locked to the deployed frontend origin, `express-rate-limit` at 100 req/15min (5/15min on `/auth/*`)
- Every request body validated with zod through a `validate(schema)` middleware — no controller trusts `req.body`
- Secrets only in `.env`; commit `.env.example` and never the real file

---

## 7. Frontend Architecture

**Route map**
```
/                       Landing / Dashboard   (public shell, personalized when logged in)
/login  /register  /forgot-password  /reset-password/:token
/trips                  My Trips            🔒
/trips/new              Create Trip         🔒
/trips/:id              Itinerary View      🔒
/trips/:id/build        Itinerary Builder   🔒
/trips/:id/budget       Budget breakdown    🔒
/trips/:id/calendar     Calendar / timeline 🔒
/cities                 City Search
/activities             Activity Search
/community              Community feed
/profile                Profile & settings  🔒
/t/:slug                Public itinerary    (no auth, no navbar chrome)
/admin                  Admin dashboard     🔒 admin
```

**Conventions**
- One folder per page: `pages/ItineraryBuilder/{index.jsx, StopCard.jsx, AddStopModal.jsx}`
- All server data goes through React Query hooks (`useTrip(id)`), never raw `useEffect` + `fetch`
- Mutations invalidate `['trip', id]` so budget / itinerary / calendar all refresh from one write
- Optimistic updates only for drag-reorder (it must feel instant); everything else waits for the server
- Every list renders three states: **loading skeleton**, **empty state with a CTA**, **error with retry**. Judges notice empty states.
- Mobile-first: build at 375px, then layer `md:` / `lg:`

---

## 8. Design System (Tailwind)

Warm, sunlit-valley palette — cream paper, terracotta and moss, soft floating pills. Deliberately not another blue SaaS dashboard.

Tailwind v4 has **no `tailwind.config.js`** — the whole system lives in `@theme` at the top of [frontend/src/index.css](frontend/src/index.css), and every token is usable as a utility (`bg-canvas`, `text-ink-700`, `shadow-lift`, `rounded-4xl`).

```css
@theme {
  --color-canvas: #faf6ef;        /* warm paper, never cold grey */
  --color-canvas-deep: #f2ebe0;
  --color-surface: #ffffff;
  --color-line: #e9e1d5;

  --color-ink-900: #17140f;  --color-ink-700: #3d372e;
  --color-ink-500: #6e665a;  --color-ink-300: #a79e90;

  --color-clay-500: #ce7440;      /* brand — sunset terracotta */
  --color-moss-500: #7e9264;      /* secondary — meadow */
  --color-dawn-300: #f7c9a3;      /* hero sky accents */

  /* Budget categories — identical in charts, badges and calendar chips */
  --color-cat-transport: #8b7bb8;  --color-cat-stay: #4fa398;
  --color-cat-activities: #ce7440; --color-cat-meals: #d9a441;

  --font-display: "Outfit";  --font-sans: "Inter";
  --shadow-soft / --shadow-lift / --shadow-pill;
  --animate-fade-up / --animate-fade-in;
}
```

**Rules**
- Never write a hex value in a component — add a token instead
- Cards: `rounded-3xl bg-surface border border-line shadow-soft`; pills and buttons are always `rounded-full`
- Buttons come from one component with six variants (`primary`, `dark`, `light`, `outline`, `ghost`, `glass`); `glass` is for controls sitting over the hero
- Page shell: `mx-auto max-w-6xl px-4 sm:px-6`
- The hero backdrop is a drawn SVG ([HeroScene.jsx](frontend/src/components/landing/HeroScene.jsx)), not a photo, so it never flashes a broken image or waits on a CDN. Swap it for an `<img>` if you get licensed photography.
- Every animation is disabled under `prefers-reduced-motion`
- Dark mode **only if time remains** — do not start it before hour 20

## 9. Screen-by-Screen Plan

Each screen lists what we build, the endpoints it calls, and its definition of done. Priority: **P0 = demo-critical**, **P1 = strongly expected**, **P2 = bonus**.

---

### 9.1 Login / Signup — `/login`, `/register` · **P0** · *(mockup screens 1–2)*
Split layout: full-bleed travel photo on the left, form card on the right. Login takes email + password with a "Forgot password?" link. Register mirrors the mockup — avatar upload circle up top, then a two-column grid: First Name / Last Name, Email / Phone, City / Country, and a full-width "Additional Information" textarea.

- **Calls:** `POST /auth/register`, `POST /auth/login`
- **Details:** react-hook-form + zod, inline field errors, password strength hint, show/hide toggle, disabled + spinner button while submitting, toast on failure, redirect to `/` on success
- **Done when:** a fresh user can register, gets bounced out on refresh-with-no-token, and can log back in

### 9.2 Dashboard / Landing — `/` · **P0** · *(mockup screen 3)*
Hero banner with a headline and a prominent search bar. Below it: **Top Regional Selections** (horizontal scroll of popular city cards), **Your Upcoming Trips** (next 3, with a countdown badge), **Previous Trips**, a **budget highlight** strip ("You've planned $4,320 across 3 trips"), and a floating **+ Plan a Trip** button bottom-right.

- **Calls:** `GET /cities/popular`, `GET /trips?limit=6`
- **Details:** logged-out visitors see the hero + popular cities + a "Get started" CTA instead of trip sections. Skeleton cards while loading.
- **Done when:** it's a genuinely good first screenshot — this is the judges' first impression

### 9.3 Create Trip — `/trips/new` · **P0** · *(mockup screen 4)*
Centered card form: trip name, description, start date, end date, cover photo dropzone, optional budget limit. Below the form, a "Suggestions for places to visit" grid of popular cities the user can pre-select — selected ones become stops immediately on save.

- **Calls:** `POST /trips`, `POST /trips/:id/stops`, `GET /cities/popular`
- **Details:** zod refine that `endDate >= startDate`; cover photo previews client-side before upload; on save go straight to `/trips/:id/build` so the flow never dead-ends
- **Done when:** creating a trip lands you in the builder with any pre-picked cities already listed

### 9.4 My Trips — `/trips` · **P1** · *(mockup screen 6)*
Search bar + Group by / Filter / Sort controls, then trips grouped under **Ongoing**, **Upcoming**, **Completed** headings. Each card: cover image, name, date range, destination count, total budget, and view / edit / delete actions.

- **Calls:** `GET /trips?status=&search=&sort=`, `DELETE /trips/:id`
- **Details:** debounced search (300ms), confirm modal before delete, empty state per group with a "Plan your first trip" CTA
- **Done when:** grouping is correct against today's date and delete cascades cleanly

### 9.5 Itinerary Builder — `/trips/:id/build` · **P0 — the centerpiece** · *(mockup screen 5)*
Vertical list of **Stop sections**, each showing the city name + country, its date range, its per-stop budget, its activity list, and edit/delete controls. `+ Add Stop` at the bottom opens a modal with a city typeahead and a date-range picker. Inside a stop, `+ Add Activity` opens a drawer with the filterable activity catalog for that city. Stops and activities are drag-reorderable via dnd-kit. A **sticky budget bar** across the bottom shows the running total and turns rose when it crosses `budgetLimit`.

- **Calls:** stops CRUD + reorder, trip-activities CRUD + reorder, `GET /trips/:id/budget`
- **Details:** reordering renumbers `order` server-side in one call. Warn (don't block) when stop dates fall outside the trip range or overlap another stop. Every mutation invalidates the trip query so the budget bar stays live.
- **Done when:** adding a city and an activity updates the total without a page reload, and a refresh shows the exact same state

### 9.6 Itinerary View — `/trips/:id` · **P0** · *(mockup screen 9)*
Read view of the finished plan. Trip header with cover photo, dates, total cost, and Share / Edit / Copy buttons. Then a **day-by-day timeline**: `Day 1 — Paris` header, activity blocks down the left with connecting arrows, cost chips down the right, and a day subtotal. A toggle switches between **timeline** and **grouped-by-city** layouts.

- **Calls:** `GET /trips/:id/itinerary`, `GET /trips/:id/budget`
- **Details:** days with no activities render a soft "Free day" placeholder rather than collapsing. Print-friendly CSS is a cheap, impressive bonus.
- **Done when:** every activity added in the builder appears on the right day in the right order

### 9.7 City Search — `/cities` · **P1** · *(mockup screen 8)*
Search bar with country/region filters and a sort control. Results are rows/cards showing image, city, country, cost index (as a small meter), popularity, and an **Add to Trip** button that opens a "pick which trip" modal.

- **Calls:** `GET /cities?...`, `POST /trips/:tripId/stops`
- **Details:** debounced server-side text search, pagination or infinite scroll, a "save to favorites" heart writing to `savedDestinations`
- **Done when:** a city found here can be added to an existing trip in two clicks

### 9.8 Activity Search — `/activities` · **P1** · *(mockup screen 8)*
Same shell as city search, filtered by type / max cost / max duration, with a city filter chip. Cards show image, name, type badge, cost, duration, rating, and Add/Remove.

- **Calls:** `GET /activities?...`, `POST /trips/:tripId/activities`
- **Details:** shares one `<SearchLayout>` component with city search — build it once, use it twice
- **Done when:** filters compose correctly (city + type + cost together)

### 9.9 Budget & Cost Breakdown — `/trips/:id/budget` · **P0** · *(mockup screen 9, budget section)*
Four KPI tiles up top: total cost, average per day, most expensive stop, remaining vs `budgetLimit`. Then a **pie chart** by category (transport / stay / activities / meals), a **bar chart** of cost per city, and a **line chart** of daily spend with any overbudget day marked in rose. A table lists per-stop costs. An alert banner appears when the trip exceeds its budget limit.

- **Calls:** `GET /trips/:id/budget`
- **Details:** all math lives in `budget.service.js` on the server — the client only renders. Consistent category colors from §8.
- **Done when:** adding one $200 activity in the builder visibly moves the pie and the total

### 9.10 Calendar / Timeline — `/trips/:id/calendar` · **P1** · *(mockup screen 11)*
Month grid with trip days shaded and activity chips inside each day cell, colored by category. Clicking a day expands a panel listing that day's activities with quick edit/delete. A toggle switches to a vertical timeline. Stretch: drag an activity from one day to another to reschedule.

- **Calls:** `GET /trips/:id/itinerary`, `PATCH /trips/:id/activities/:id`
- **Done when:** the month renders correctly for a trip spanning two months

### 9.11 Public / Shared Itinerary — `/t/:slug` · **P0 — differentiator**
Chrome-free read-only page: cover photo hero, trip summary, day-wise itinerary, budget summary, "planned by {firstName}", a **Copy Trip** button, and social share buttons (WhatsApp / X / copy-link). Copying while logged out routes through login and resumes afterward.

- **Calls:** `GET /public/trips/:slug`, `POST /trips/:id/copy`
- **Details:** the serializer strips all owner PII. On the owner's side, the Share button opens a modal with a public toggle and a copy-to-clipboard link.
- **Done when:** the link opens in an incognito window and Copy Trip clones the whole itinerary into a second account

### 9.12 Profile / Settings — `/profile` · **P1** · *(mockup screen 7)*
Left: avatar with upload. Right: editable name, email, phone, city, country, bio, language preference. Below: **Preplanned Trips** and **Previous Trips** card grids, a saved-destinations list, a change-password section, and a red **Delete Account** zone behind a type-to-confirm modal.

- **Calls:** `PATCH /users/me`, `PATCH /users/me/avatar`, `DELETE /users/me`, `GET /trips`
- **Done when:** an avatar upload persists across a reload

### 9.13 Community Feed — `/community` · **P2** · *(mockup screen 10)*
Feed of public trips: author avatar, trip name, destination chips, duration, total budget, view count, and a View button — plus the shared search / group-by / filter / sort bar. This is effectively a browse view over `isPublic` trips, so it's cheap to build once §9.11 exists.

- **Calls:** `GET /public/trips?search=&sort=`
- **Done when:** publishing a trip makes it appear in the feed

### 9.14 Admin / Analytics — `/admin` · **P2** · *(mockup screen 12)*
Admin-only. Tab bar: **Manage Users**, **Popular Cities**, **Popular Activities**, **User Trends & Analytics**. KPI tiles (total users, total trips, trips this week, avg budget), a pie of top cities, a bar of top activities, a line of signups over 30 days, and a user table with role toggle and delete.

- **Calls:** `GET /admin/*`
- **Details:** aggregation pipelines, not JS loops. Guard the route on both client and server. Seed one admin account in `seed.js`.
- **Done when:** a non-admin hitting `/admin` gets bounced, and an admin sees real numbers

---

## 10. Execution Plan (Hackathon Timeline)

Roughly a 24–30 hour build. Ship a working vertical slice early; polish late.

| Phase | Hours | Deliverable |
| --- | --- | --- |
| **0 — Setup** | 0–2 | Repo scaffold, Vite + Tailwind, Express + Atlas connected, `.env.example`, shared API contract agreed, one dummy endpoint rendering in the browser |
| **1 — Auth** | 2–5 | User model, register/login/refresh/me, JWT middleware, login + register pages, ProtectedRoute, axios interceptor. **Auth must land before anything else starts.** |
| **2 — Data + seed** | 4–6 | All models, indexes, 60+ cities and 200+ activities seeded (runs in parallel with phase 1) |
| **3 — Trip CRUD** | 5–9 | Trip endpoints, Create Trip page, My Trips page, trip card component, `components/ui/` finished |
| **4 — Builder** | 9–15 | Stops + trip-activities endpoints, Itinerary Builder screen, add-stop modal, activity drawer, drag reorder. **The single most important block — protect this time.** |
| **5 — Budget + views** | 15–19 | `budget.service.js`, budget screen with all three charts, itinerary view timeline |
| **6 — Search + share** | 19–23 | City search, activity search, share endpoint, public `/t/:slug` page, Copy Trip |
| **7 — Calendar + profile** | 23–26 | Calendar screen, profile/settings |
| **8 — Bonus** | 26–28 | Community feed, admin dashboard (only if 1–7 are genuinely done) |
| **9 — Ship** | 28–30 | Deploy, seed prod DB, create demo accounts, record video, README screenshots, ER diagram, rehearse the demo twice |

**Hard rules**
- Deploy at the end of phase 3, not at hour 29. A broken build discovered at hour 29 loses the hackathon.
- Commit every working feature; never leave `main` broken overnight.
- If a phase runs over, cut a P2 screen — **never cut phases 4 or 5.**

---

## 11. Seed Data Strategy

Judges see an empty app as an unfinished app. Seeding is not optional.

- `seed/cities.json` — 60+ cities across 6 regions with `costIndex`, `popularity`, and an image URL each
- `seed/activities.json` — 3–5 activities per major city spanning every type, with realistic costs and durations
- `seed.js` — wipes and reloads catalog collections, then creates:
  - `admin@globetrotter.com / Admin@123` (role: admin)
  - `demo@globetrotter.com / Demo@123` with **3 pre-built trips** — one completed, one ongoing, one upcoming — the upcoming one fully fleshed out with 3 cities and 10+ activities for the public-share demo
- Run: `npm run seed` in `backend/`. Re-runnable and idempotent.

---

## 12. Environment & Setup

**Prerequisites:** Node 20+ and a MongoDB Atlas connection string.

```bash
# 1 — API  (http://localhost:5000)
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI + both JWT secrets
npm run seed              # 30 cities + admin/demo accounts
npm run dev

# 2 — Web  (http://localhost:5173) — second terminal
cd frontend
npm install
npm run dev
```

`backend/.env`
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/globetrotter?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<64+ random hex chars>
JWT_REFRESH_SECRET=<a different 64+ random hex chars>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

Generate the secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`frontend/.env`
```
VITE_API_URL=http://localhost:5000/api/v1
```

**Notes**
- The database name (`/globetrotter`) must be in the URI or Mongo writes to `test`
- `.env` is gitignored. If a credential ever lands in a commit, rotate it in Atlas — deleting the line does not un-leak it
- Health check: `curl http://localhost:5000/api/v1/health`
- `npm run seed` is idempotent — safe to re-run any time

## 13. Deployment

- **Frontend → Vercel:** root `frontend`, build `npm run build`, output `dist`, set `VITE_API_URL` to the Render URL, add a SPA rewrite so deep links like `/t/:slug` don't 404
- **Backend → Render:** root `backend`, start `node src/server.js`, all env vars set, CORS `origin: CLIENT_URL, credentials: true`
- **DB → Atlas:** free M0, network access `0.0.0.0/0` for the demo, run the seed against production once
- Cookies in production need `sameSite:'none', secure:true` since the origins differ — **test this before the demo; it is the classic last-minute failure**

---

## 14. Demo Script

Rehearse until it's 4 minutes flat, and keep a seeded fallback account open in a second tab in case a live write fails.

1. Land on the dashboard — popular cities, upcoming trips, budget highlight
2. Plan a Trip → "Europe Summer 2026", pick dates, upload a cover
3. Builder → add Paris (3 nights), add Rome (2 nights), drag to reorder
4. Add activities: Louvre, Seine cruise, Colosseum — watch the sticky budget bar climb
5. Budget screen → pie, per-city bar, daily-spend line, overbudget alert
6. Calendar → activities laid out across the month
7. Share → toggle public, copy the link, open it in incognito
8. From the second account, Copy Trip → it lands in that user's My Trips
9. Log in as admin → analytics tiles, top cities, user trends
10. Close on the ER diagram + the relational modeling justification from §2

---

## 15. Scope Guardrails

**In scope:** everything marked P0 and P1 in §9.

**Explicitly out of scope** — say no fast if these come up:
- Real payments or bookings
- Live flight/hotel APIs (Amadeus, Skyscanner) — rate limits and API-key approval will eat hours
- Real-time collaborative editing (websockets)
- A native mobile app — responsive web only
- Email delivery for password reset — return the token in the dev response and note it as a stub
- Multi-currency FX conversion — one base currency, mention FX as future work
- AI itinerary generation — tempting, but a demo-day risk unless P0 and P1 are fully done

**Definition of done for the whole project:** a stranger can sign up on the deployed URL, build a two-city trip with activities, see an accurate budget breakdown, share a public link, and have someone else copy that trip — with no console errors and no broken states on a 375px screen.
