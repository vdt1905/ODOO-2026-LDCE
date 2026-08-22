# GlobeTrotter

Multi-city travel itinerary planner. Hackathon project, two contributors, MERN + Gemini.

Plan a trip across several cities, give each city a date range and a budget, hang
activities off each day, and watch the cost add up per day, per city and per
category. A finished trip can be published to a public URL that anyone can view
and copy onto their own account.

---

## Running it

Two processes, two terminals.

```bash
# API — http://localhost:5000
cd backend && npm install && npm run dev

# Web — http://localhost:5173
cd frontend && npm install && npm run dev
```

`backend/.env` is required — copy `.env.example` and fill it in. `MONGO_URI`,
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are mandatory; the server exits at
boot without them. Everything else degrades rather than crashes:

| Missing | Effect |
| --- | --- |
| `CLOUDINARY_*` | Uploads answer `503`; the rest of the app is unaffected |
| `GEMINI_API_KEY` | `/ai/status` reports `available: false` — gate the UI on it |

`npm run seed` in `backend/` loads 30 cities and their activities. Run it once,
or city search and the trip builder have nothing to show.

---

## Layout

```
backend/src
  models/          Mongoose schemas + the ACTIVITY_TYPES / REGIONS enums
  controllers/     One per resource; thin, all wrapped in asyncHandler
  services/        budget.service.js, itinerary.service.js, ai.service.js
  validators/      Zod (v3) request schemas — the ONLY input validation
  middleware/      auth, validate, error, upload
  routes/          index.js mounts everything under /api/v1
  utils/           ApiError, apiResponse, dates, escapeRegex
  seed/            cities.json + activities.json

frontend/src
  api/             One module per resource; each unwraps the response envelope
  components/      ui/ (primitives) · layout/ · landing/ · dashboard/ · trip/
  hooks/           Fetch-on-key-change hooks — there is no query library
  lib/             constants, dates, format, validation (Zod v4), cn
  pages/           One folder per screen
  store/           authStore.js (zustand)
```

---

## Conventions that will bite you if you miss them

**Every response is enveloped.** `{ success, message, data }`. The `api/*.js`
modules unwrap `data` so no component ever writes `r.data.data`. Errors use a
different shape — `{ success: false, message, errors: [{ field, message }] }`
with **no `data` key** — which is what `toApiError` in `api/client.js` normalises.

**`_id` is the id. `id` is not always there.** Controllers using `.lean()`
return raw documents with no `id` virtual. Only `Trip`, `Stop` and `User` set
`virtuals: true`, and only when returned as documents rather than lean. Key
React lists on `_id`.

**Two date formats ship in the same payload.** `days[].date` and
`overBudgetDays[]` are `'YYYY-MM-DD'` strings; every other date is a full ISO
datetime. Dates are normalised to UTC day boundaries server-side — do not
reconstruct a date with `new Date(y, m, d)`, which lands in local time and can
shift a trip's status by a day. Use `lib/dates.js`.

**Zod is v3 on the server and v4 in the browser.** They are not interchangeable;
do not copy a schema across the boundary.

**Update schemas are `.strict()`.** Sending a key the server does not recognise
is a `422`, not a silent ignore. Send only what changed — in particular never
send `order` in an update, because reordering has its own endpoint.

**`warnings` is not an error.** Stop and activity writes resolve to
`{ stop, warnings }`. The write already succeeded; `warnings` flags dates that
fall outside the trip or overlap another stop. Render them, do not throw.

**Omitting `cost` inherits it.** On `POST /trips/:id/activities`, leaving out
`cost` or `durationMinutes` makes the server copy the catalog value. Sending
`cost: 0` pins it to zero, which is almost never what the user meant.

**Reorder payloads differ.** Stops need *every* id on the trip or the request is
rejected; activities accept one day's ids. Both return the full re-sequenced list.

**Route order matters.** `/trips/stats` is declared before `/trips/:tripId`, and
`/reorder` before `/:stopId`. Adding a static route below a param route makes
Express read the literal as an id.

**`GET /ai/status` requires auth.** It cannot be called before sign-in, so the
AI entry point cannot be gated on a pre-login screen.

---

## Design language

Warm paper and deep forest, editorial rather than SaaS. The reference build is
in `Multi-city itinerary planner/` (untracked — do not commit it).

Tokens live in `frontend/src/index.css` under `@theme`. Tailwind v4, so there is
no `tailwind.config.js`; components use token names (`bg-canvas`, `text-ink-700`,
`border-line`) and never raw hex.

- `canvas` `#f6f4ef` · `surface` white · `inset` `#f9f8f4`
- `brand` deep forest, 500 = `#2e4034` — the only primary action colour
- `ember` warm `#c2703f` — over-budget, drafts, destructive. Never a primary action
- `ink` 900/700/500/300 for text

**Elevation comes from 1px borders, not shadows.** The shadow tokens exist but
are deliberately almost invisible, so a stray `shadow-*` cannot make a card
float off the page and break the flat feel. Reach for `border-line` instead.

**Headers own their photograph.** `components/layout/PageHeader.jsx` is the
container and the navbar sits *inside* it, so the image reads as the background
of the top bar. The earlier treatment — a ~150px strip below an opaque nav —
looked like a YouTube channel banner and is what this replaces. `<main>` has no
top padding; the header provides its own clearance with `pt-28`.

**Type is switchable at runtime.** `--font-display` and `--font-sans` resolve
through `--gt-display` / `--gt-body`, which the dev panel rewrites on `<html>`.
That indirection is the only reason a font swap needs no rebuild.

---

## Temporary: the dev type panel

`components/dev/DevSettings.jsx` (button bottom-left, `Ctrl/Cmd + .`) switches
font pairings, heading casing and base size live, persisted to localStorage.

**Remove before the final build** — delete the component, `lib/devSettings.js`,
the `bootDevSettings()` call in `main.jsx`, the `<DevSettings />` mount in
`App.jsx`, and trim `index.html` down to the one pairing that survives.

---

## Housekeeping

`plan.md` and `Multi-city itinerary planner/` stay untracked. Do not stage them.
