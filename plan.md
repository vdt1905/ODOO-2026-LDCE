# GlobeTrotter — 5-Hour Build Plan

> **Team LDCE · 2 developers · T+0:00 → T+5:00**
> Companion to [README.md](README.md). The README defines *what* the system is (data model, API contract, design system). **This file defines who builds what, when, and on which branch.**

---

## 1. Context

### The problem statement
`GlobeTrotter.pdf` asks for a complete multi-city travel planning app with 13 features: auth, dashboard, create trip, my trips, itinerary builder, itinerary view, city search, activity search, budget breakdown, calendar/timeline, public sharing, profile, and an optional admin dashboard. It stresses **proper relational modelling** and **dynamic UIs that adapt to each user's trip flow**.

### What already exists (verified against the repo, not the README)

| Area | State |
| --- | --- |
| Backend: models (`User`, `City`, `Activity`, `Trip`, `Stop`, `TripActivity`) | ✅ all 6 written |
| Backend: auth API (register/login/refresh/logout/me/forgot/reset) | ✅ done |
| Backend: city catalog API + user API + Cloudinary uploads | ✅ done |
| Backend: seed — **30 cities** | ✅ done |
| Frontend: design tokens, UI kit, layout, route guards, axios + silent refresh, Zustand auth store | ✅ done |
| Frontend: Landing, Login, Register | ✅ done |

### The gap — everything below must be built in 5 hours

**Backend is missing:** `trip` / `stop` / `tripActivity` / `public` / `admin` controllers + routes, `budget.service.js`, `itinerary.service.js`, `copyTrip.service.js`, `gemini.service.js`, and the trip/stop validators.

**Frontend is missing:** every screen except Landing/Login/Register. All 11 remaining routes currently render a `ComingSoon` placeholder ([routes.jsx](frontend/src/routes.jsx)).

**Three blockers found during analysis:**

1. **The activity catalog is empty.** `seed/cities.json` has 30 cities; there is no `activities.json`. Without it the Activity Search screen (PS #8), the builder's activity drawer, and the activities slice of every budget chart are all empty. → **Fixed in Phase 1 by hand-authoring `seed/activities.json`** (static data, no API dependency, idempotent).
2. **Five libraries the README assumes are not installed:** TanStack Query, Recharts, date-fns, dnd-kit. → Installed in Phase 0.
3. **The README explicitly scoped AI *out*.** We are deliberately overriding that — AI trip generation is now the headline differentiator. Section 4 specifies it.

### Honest scope warning

You asked for the core spine **plus** City Search, Activity Search, Calendar, Profile, **and** Admin, plus AI generation and a live deploy — in 10 person-hours. That is roughly a third of the 24–30 hour budget the README was written against. It is achievable only because auth, the design system, and the UI kit are already done.

**The plan below delivers all of it**, but §8 defines a cut ladder in priority order. If we hit T+3:45 and Phase 4 isn't merged, cut from the bottom of that ladder without discussion — Admin first. Admin is marked *optional* in the problem statement itself; the builder and budget screens are not.

---

## 2. Ground rules

### File ownership — this is what keeps merges clean

**Two long-lived branches, one per stack.** No feature branches — at this timescale branch churn costs more than it buys.

| Owner | Branch | Directory | Never touches |
| --- | --- | --- | --- |
| **Dev A** | `backend` | `backend/**` | `frontend/**` |
| **Dev B** | `frontend` | `frontend/**` | `backend/**` |

The two branches touch **disjoint directories**, so a merge can never conflict and `main` can never be broken by a merge — only by a broken commit. The full API contract is already frozen in [README §5](README.md#5-api-surface), so neither dev waits on the other to agree on shapes.

**After Phase 4 the backend is complete.** Dev A then joins Dev B *on the `frontend` branch* for Phase 5 — see the ownership rules there.

**Nobody edits `README.md` or `plan.md` until Phase 6.**

### Branch protocol

Cut both branches once, at T+0:00, and stay on them for the whole build:

```bash
git checkout main && git pull
git checkout -b backend         # Dev A
git checkout -b frontend        # Dev B
git push -u origin <your branch>
```

Commit every working sub-feature and **push at least every 20 minutes**, so the other dev can always see where you are without asking.

At each merge gate, **both** devs run:

```bash
git checkout main && git pull
git merge <your branch> --no-ff
git push
git checkout <your branch> && git merge main    # take main back down
```

That last line matters — it's how Dev B picks up the endpoints Dev A just shipped.

**Merge gates: T+1:20 · T+2:20 · T+3:45 · T+4:30 · T+4:50 (final).**
They are hard sync points. If one dev isn't ready, the other merges anyway; the late branch picks up `main` on its next merge-down.

### Non-negotiables

- **Never leave `main` broken.** If your branch doesn't boot, don't merge it.
- **Commit every working sub-feature**, not once per phase.
- Backend: controllers call `sendSuccess`/`sendCreated`, never `res.json`. Every body validated by a zod schema through `validate()`. Every trip route re-checks `trip.user === req.user.id` — the client guard is UX only.
- Frontend: every colour and radius comes from a token in [index.css](frontend/src/index.css). **No hex values in components.** Every list renders three states: loading skeleton, empty + CTA, error + retry.
- Mobile-first: build at 375px, layer `md:` / `lg:` after.

---

## 3. Environment additions

Add to `backend/.env` (and mirror the keys, not the values, into `.env.example`):

```
GEMINI_API_KEY=<your key from aistudio.google.com/apikey>
GEMINI_MODEL=gemini-2.5-flash
AI_TIMEOUT_MS=30000
```

`GEMINI_API_KEY` is **server-side only** and must never reach the browser. All model traffic goes through `/api/v1/ai/*`.

Frontend installs (Phase 0, Dev B):

```bash
cd frontend
npm i @tanstack/react-query recharts date-fns @dnd-kit/core @dnd-kit/sortable react-hot-toast
```

Backend installs: **none.** Node 20 has global `fetch`, so we call the Gemini REST endpoint directly rather than adding `@google/genai` — one less dependency and one less SDK-shape unknown during a timed build.

---

## 4. The AI engine (Dev A, Phase 2)

This is the differentiator. A user types *"10 days in Japan in April, mid-range budget, food and temples, no hiking"* and gets a complete, editable, costed multi-city itinerary written into real `Stop` and `TripActivity` rows.

### Endpoint

`POST /api/v1/ai/generate-trip` — auth required, rate-limited to **5 requests / 15 min / user**.

```jsonc
// request
{
  "prompt": "10 days in Japan in April, mid-range budget, food and temples, no hiking",
  "startDate": "2026-04-05",
  "days": 10,
  "travelers": 2,
  "budgetLimit": 3000,
  "currency": "USD",
  "pace": "balanced"          // relaxed | balanced | packed
}

// response — the trip already exists in the DB, fully editable
{ "success": true, "data": { "tripId": "...", "stopCount": 3, "activityCount": 24 } }
```

The client then redirects to `/trips/:tripId/build`. Nothing about the result is read-only — it is a *draft the user edits*, which is exactly why it's safe to demo.

### Transport

```
POST https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent
header: x-goog-api-key: ${GEMINI_API_KEY}
```

with `generationConfig.responseMimeType: "application/json"` and a `responseSchema`. **Structured output is mandatory** — it removes markdown-fence stripping and JSON repair entirely, which is where hackathon AI features usually die.

### Response schema (shape Gemini is forced into)

```jsonc
{
  tripName, description, currency,
  stops: [{
    cityName, country, region,
    costIndex,                    // 1-100, used if we must create the City
    latitude, longitude, cityDescription,
    nights,                       // integer
    transportCost,                // to reach THIS city from the previous one
    accommodationCost,            // whole stay, not per night
    mealBudgetPerDay,
    notes,
    activities: [{
      name, description,
      type,                       // enum: sightseeing|food|adventure|culture|nightlife|relaxation|shopping
      dayOffset,                  // 0-based day WITHIN this stop
      startTime,                  // "HH:mm"
      durationMinutes,
      cost
    }]
  }]
}
```

> **Design note — why `dayOffset` and not a real date.** Models are unreliable at calendar arithmetic and will happily emit dates that drift or overlap. We ask only for a relative offset and compute every real date server-side from `trip.startDate` plus the cumulative nights of preceding stops. Date correctness becomes our problem, not the model's, and it stops being a source of demo-day bugs.

The extra city fields (`region`, `costIndex`, `latitude`, `longitude`) exist so that a city outside our 30-city catalog can be created in the same pass — no second model call.

### System prompt

Store it as a template literal in `backend/src/services/prompts/tripPlanner.prompt.js` so it's editable without touching logic.

```
You are an expert travel planner who has personally visited every destination
you recommend. You produce realistic, well-paced, geographically sensible
itineraries — never generic filler.

HARD CONSTRAINTS
- The `nights` across all stops MUST sum to exactly {days}.
- Minimum 2 nights per city, unless the whole trip is under 5 days.
- At most {maxStops} cities — a death march between cities ruins a trip.
- Order the cities geographically to minimise backtracking. Follow real
  overland or short-haul routes; never zigzag across a country.
- Every activity's `dayOffset` must be < that stop's `nights` value.

PACING ({pace})
- relaxed  -> 2 activities per day
- balanced -> 3 activities per day
- packed   -> 4 activities per day
- Start times between 08:00 and 22:00. Activities on the same day must not
  overlap once durationMinutes is accounted for; leave travel and meal gaps.
- On any trip longer than 7 days, make at least one day deliberately light.
- The first day of each stop after the first starts no earlier than 13:00 —
  the traveller is in transit that morning.

COSTS — all per person, in {currency}
- Realistic for the destination's actual price level. Tokyo is not Hanoi.
- transportCost is the cost of reaching THAT city from the previous one
  (for the first stop, the international arrival leg).
- accommodationCost is for the ENTIRE stay at that stop, not per night.
- Free attractions get cost 0. Do not pad numbers to look busy.
- Keep the grand total within 10% of {budgetLimit}.

SPECIFICITY
- Name real, specific places: "Fushimi Inari Taisha at sunrise", never
  "visit a shrine". A judge should be able to Google every line.
- Vary the activity types — do not return seven museums.

Honour every preference and exclusion in the user's brief. If they say no
hiking, there is no hiking.

USER BRIEF: {prompt}
```

Interpolate `days`, `pace`, `currency`, `budgetLimit`, `travelers`, `prompt`, and `maxStops` (`Math.max(1, Math.floor(days / 3))`).

### Server pipeline — `ai.service.js`

1. **Call** Gemini with a 30s `AbortController` timeout. One retry on 5xx or a schema-validation miss.
2. **Validate** the parsed JSON with a zod schema before anything touches Mongo. Reject rather than write garbage.
3. **Reconcile nights** — if they don't sum to `days`, adjust the longest stop. Never fail the request over arithmetic.
4. **Resolve each city** — case-insensitive exact match on `City.name` → text search → **create** from the fields the model returned. The catalog grows itself.
5. **Upsert each activity** into the `Activity` catalog for its city, then reference it from `TripActivity`. This keeps referential integrity *and* organically enriches Activity Search. (`TripActivity.customName` with `activity: null` stays the fallback path.)
6. **Materialise** — create the `Trip`, then walk the stops accumulating dates:
   `stop.startDate = tripStart + Σ(previous nights)`, `stop.endDate = stop.startDate + nights`,
   `tripActivity.date = stop.startDate + dayOffset`.
7. Return `{ tripId, stopCount, activityCount }`.

### Failure behaviour

Never leave a half-written trip. Build the whole object graph in memory, validate it, and only then write — and if any write throws, delete the `Trip` and its children before returning a 502 with a plain-English message. The UI offers "Try again" or "Start from scratch instead", so an AI failure costs the demo 15 seconds, not the run.

### Frontend UX (Dev B, Phase 3)

On `/trips/new`, a segmented control at the top: **Plan it myself** · **✨ Plan with AI**.

The AI panel takes a free-text brief plus start date, days, travellers, budget, and pace chips. On submit, a full-screen staged loader — *"Reading your brief…" → "Choosing your cities…" → "Routing the journey…" → "Pricing each day…"* — advancing on a timer, since we aren't streaming. Fifteen seconds of honest progress reads as craft; a bare spinner reads as a hang.

Then straight into the builder with an **"✨ AI drafted"** badge on the trip header.

---

## 5. New API surface (additions to README §5)

Everything else is already specified in [README §5](README.md#5-api-surface). Only these are new:

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/ai/generate-trip` | §4 above |

Endpoints from README §5 that still need **building**: all of `/trips`, `/trips/:tripId/stops`, `/trips/:tripId/activities`, `/trips/:id/budget`, `/trips/:id/itinerary`, `/trips/:id/share`, `/trips/:id/copy`, `/public/*`, `/admin/*`.

---

## 6. Phase timeline

### Phase 0 · Launch — T+0:00 → T+0:20 · both

| Dev | Work |
| --- | --- |
| **A** | Add the three `GEMINI_*` vars to `.env` + `.env.example`. Smoke-test the key with a one-line `curl` to `generateContent` **before** writing any code — a bad key discovered at T+2:00 is expensive. Confirm `npm run dev` boots and `/api/v1/health` responds. |
| **B** | `npm i` the five frontend libs (§3). Mount `QueryClientProvider` + `<Toaster/>` in [App.jsx](frontend/src/App.jsx). Confirm `npm run dev` boots and login works with `demo@globetrotter.com / Demo@1234`. |
| **Both** | Skim §4 together so the AI contract is shared knowledge. Cut the `backend` / `frontend` branches (§2) and push them. |

**Gate:** both servers up, both logged in, both branches pushed to origin.

---

### Phase 1 · The spine — T+0:20 → T+1:20

**Dev A — on `backend`**
- `validators/trip.validator.js`, `stop.validator.js`, `tripActivity.validator.js` (zod; `endDate >= startDate` via `.refine()`)
- `controllers/trip.controller.js` — list (`?status=&search=&sort=&page=`), create, get (populate stops→city, tripActivities→activity), patch, delete (cascade stops + tripActivities), cover upload
- `controllers/stop.controller.js` — CRUD + `PATCH /reorder` taking `{ orderedIds: [] }`
- `controllers/tripActivity.controller.js` — CRUD + reorder
- Route files + wire into `routes/index.js`
- **`seed/activities.json`** — 5–7 activities per city × 30 cities (~180 rows), every `type` represented, realistic `cost` / `durationMinutes` / `rating`. Update `seed.js` to load it. *This is the fix for blocker #1 — without it three screens render empty.*
- **Ownership guard:** a shared `loadOwnedTrip(tripId, userId)` helper used by every trip-scoped controller. Write it once.

**Dev B — on `frontend`**
- `api/trip.api.js` + React Query hooks (`useTrips`, `useTrip`, `useCreateTrip`, …). All mutations invalidate `['trip', id]` so budget/itinerary/calendar refresh from one write.
- `components/trip/TripCard.jsx`
- `pages/Trips/` — search + group by Ongoing / Upcoming / Completed, delete confirm modal, per-group empty states
- `pages/CreateTrip/` — manual form (name, description, dates, cover dropzone, budget limit) + popular-city pre-select grid
- Swap both `ComingSoon` entries out of [routes.jsx](frontend/src/routes.jsx)

**🔀 Merge gate T+1:20.** Both merge to `main`, both pull, both verify: create a trip in the UI, see it in My Trips, refresh, still there.

---

### Phase 2 · Builder + AI — T+1:20 → T+2:20

**Dev A — on `backend`**
- `services/gemini.service.js` — the raw-fetch transport, timeout, retry
- `services/prompts/tripPlanner.prompt.js` — §4's system prompt
- `services/ai.service.js` — the 7-step pipeline in §4
- `controllers/ai.controller.js` + `routes/ai.routes.js` + its rate limiter
- `services/budget.service.js` — the derived values from [README §4](README.md#4-data-model): per-stop nights / activity total / meal total, trip total, avg per day, `dailySpend[date]`, overbudget flags. **All budget math lives here — the client only renders.**
- `services/itinerary.service.js` + `GET /trips/:id/budget` and `GET /trips/:id/itinerary`

**Dev B — on `frontend`**
- `pages/ItineraryBuilder/` — **the centrepiece.** Stop sections (city, country, date range, per-stop budget, activity list), `AddStopModal` with city typeahead + date range, `ActivityDrawer` with the filterable catalog for that city
- dnd-kit reorder for both stops and activities, optimistic (it has to feel instant)
- Sticky bottom budget bar with the running total, turning rose past `budgetLimit`
- Warn — don't block — when stop dates fall outside the trip range or overlap

**🔀 Merge gate T+2:20.** Verify: add a city and an activity, watch the total move without a reload; refresh shows identical state.

---

### Phase 3 · Deploy checkpoint — T+2:20 → T+2:45

**This is a hard gate, not a background task.** Deploying now surfaces CORS and cookie failures while there are still two hours to fix them. Deploying at T+4:45 has lost more hackathons than any missing feature.

**Dev A** — Render (backend, root `backend`, start `node src/server.js`, all env vars incl. `GEMINI_*`) → Atlas network access → run the seed against prod → Vercel (frontend, root `frontend`, output `dist`, `VITE_API_URL` → Render URL, **SPA rewrite** so `/t/:slug` doesn't 404) → set `CLIENT_URL` on Render → **verify login works on the deployed URL.**

> Cross-origin cookies need `sameSite:'none', secure:true` in production. If login works locally and fails deployed, this is why. It is the single most common last-minute failure.

**Dev B** — keeps building through this: the AI generate panel, the staged loader, and the segmented control on `/trips/new` (§4, frontend UX).

---

### Phase 4 · Budget, views, share — T+2:45 → T+3:45

**Dev A — on `backend` (final backend phase)**
- `POST /trips/:id/share` (mint `nanoid(12)` slug) · `DELETE /trips/:id/share`
- `controllers/public.controller.js` — `GET /public/trips/:slug` (bump `viewCount`; **serializer strips owner email, phone, and internal IDs**) · `GET /public/trips` for the community feed
- `services/copyTrip.service.js` + `POST /trips/:id/copy` — deep-clone trip → stops → tripActivities into the caller's account, setting `copiedFrom`
- `controllers/admin.controller.js` — `/stats`, `/popular-cities`, `/popular-activities`, `/trends?days=30`, `/users`. **Mongo aggregation pipelines, not JS loops.** Guarded by `requireAdmin`.

**Dev B — on `frontend`**
- `pages/Budget/` — four KPI tiles (total, avg/day, priciest stop, remaining vs limit), Recharts **pie** by category, **bar** per city, **line** of daily spend with overbudget days in rose, per-stop table, overbudget alert banner. Category colours come from the `--color-cat-*` tokens already in [index.css](frontend/src/index.css) — identical across charts, badges and calendar chips.
- `pages/ItineraryView/` — trip header (cover, dates, total, Share/Edit/Copy) + day-by-day timeline with activity blocks, cost chips and day subtotals. Toggle between timeline and grouped-by-city. Empty days render a soft "Free day", never collapse.

**🔀 Merge gate T+3:45.** Verify: adding a $200 activity visibly moves the pie and the total.

---

### Phase 5 · Breadth — T+3:45 → T+4:30

Dev A's backend is complete, so **A now joins B on the `frontend` branch** — the only phase where both devs share a branch. Three rules keep that safe:

1. **Ownership re-splits by page directory** (below). Stay inside yours.
2. **`git pull --rebase` before every push.** Push small and often.
3. **Dev B owns [routes.jsx](frontend/src/routes.jsx) exclusively.** It's the one file both of you would otherwise touch. Dev A builds the page components; Dev B wires the routes — just say which paths you need.

**Dev A** — owns `pages/CitySearch/`, `pages/ActivitySearch/`, `pages/Admin/`
- One shared `<SearchLayout>` built once, used by both search screens. City search: debounced (300ms) server-side search, country/region filters, cost-index meter, "Add to Trip" modal. Activity search: type / max cost / max duration filters + city chip.
- Admin: KPI tiles, top-cities pie, top-activities bar, 30-day signup line, user table with role toggle. Guard on client **and** server.

**Dev B** — owns `pages/PublicTrip/`, `pages/Calendar/`, `pages/Profile/`, plus `routes.jsx`
- `/t/:slug` — chrome-free public page: cover hero, summary, day-wise itinerary, budget summary, "planned by {firstName}", **Copy Trip**, WhatsApp/X/copy-link share. Owner-side Share modal with a public toggle.
- Calendar — hand-rolled month grid with date-fns (skip react-big-calendar; the grid is ~40 lines and matches our tokens). Trip days shaded, activity chips coloured by category, click a day to expand.
- Profile — avatar upload (backend already live), editable fields, saved destinations, delete-account zone behind a type-to-confirm modal.

**🔀 Merge gate T+4:30.**

---

### Phase 6 · Ship — T+4:30 → T+5:00 · both

- Final merge to `main`, redeploy both halves, re-seed prod
- **Feature freeze at T+4:40.** After that: blocking bugs only.
- Walk the full demo script (§7) end-to-end on the **deployed** URL, twice
- Check 375px on every screen; check the console is clean
- Update the README status table; add screenshots + the ER diagram to `/docs`

---

## 7. Verification — the demo script

Rehearse until it runs in four minutes flat. Keep a seeded account open in a second tab as a fallback in case a live write fails.

1. Land on the dashboard — popular cities, upcoming trips, budget highlight
2. **✨ Plan with AI** → *"10 days in Japan in April, mid-range, food and temples, no hiking"* → watch the staged loader → land in the builder with 3 cities and ~24 costed activities
3. Builder — drag to reorder a stop, add one activity from the catalog, watch the sticky budget bar climb
4. Budget → pie, per-city bar, daily-spend line, overbudget alert
5. Calendar → the activities laid out across the month
6. Itinerary View → the day-by-day timeline
7. Share → toggle public, copy the link, open it in an incognito window
8. From a second account → **Copy Trip** → it appears in that user's My Trips
9. City Search → find a city → Add to Trip
10. Log in as admin → analytics tiles, top cities, user trends
11. Close on the ER diagram and the relational-modelling justification ([README §2](README.md#-on-relational-database))

### Definition of done
A stranger can sign up on the deployed URL, generate a trip with AI *or* build one by hand, see an accurate budget breakdown, share a public link, and have someone else copy it — with no console errors and no broken states at 375px.

---

## 8. Cut ladder

If a merge gate slips, cut from the **bottom up**, immediately and without debate:

| Cut order | Feature | Why it's safe to cut |
| --- | --- | --- |
| 1 | **Admin dashboard** | The problem statement marks it *optional*. |
| 2 | **Community feed** | Not asked for in the PS; `/public/trips` covers the idea. |
| 3 | **Calendar** | The Itinerary View timeline already shows the day-by-day plan. |
| 4 | **Activity Search** | The builder's activity drawer already surfaces the catalog. |
| 5 | **Profile** | Auth already proves user management works. |

**Never cut:** Itinerary Builder, Budget, AI generation, Public Share. Those four *are* the demo.

---

## 9. Known gotchas

- **zod v4 on the frontend, v3 on the backend.** `z.string().email()` is deprecated in v4 (`z.email()`). Don't copy-paste schemas between the two halves without checking.
- **react-router-dom is v7**, not the v6 the README mentions. The APIs we use are unchanged.
- **Tailwind v4 has no `tailwind.config.js`.** Every token lives in `@theme` at the top of [index.css](frontend/src/index.css). Add a token; never write a hex in a component.
- **`cities.json` descriptions contain mojibake** (`â€"` where an em-dash belongs). Two-minute fix — worth doing before screenshots.
- **Cloudinary vars are optional** — the API boots without them and upload routes return a clear 503, so a teammate without keys isn't blocked.
- The DB name must be in the Mongo URI or Mongoose writes to `test`.

---

## 10. Pending — UI references

Pinterest references are coming from the team. When they land, translate them into **token changes in [index.css](frontend/src/index.css)**, not per-component overrides. The current system (warm cream canvas, terracotta brand, moss secondary, `rounded-3xl` cards, `rounded-full` pills, three shadow tiers) is deliberately not another blue SaaS dashboard and is worth keeping unless a reference argues otherwise.

Re-skinning through tokens means a palette change costs one file and zero regressions. Re-skinning per component costs the rest of the hackathon.
