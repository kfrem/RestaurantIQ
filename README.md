# RestaurantIQ — Process Intelligence Platform

A visual cost & profit optimisation platform for restaurants. Track your value chain, simulate scenarios, and get data-driven recommendations.

## Features

- **Dashboard** — Revenue/cost trends, weekly profit estimate, KPIs at a glance
- **Quick Assessment** — Mobile-first 4-step wizard for live client demos
- **Menu & Recipes** — Ingredient-level costing, profit per serve, target serves calculator
- **Supplier Risk** — Dependency tracking, single-source flags, price inflation alerts
- **Cost Classification** — Direct / Indirect / Overhead breakdown with charts
- **Promotions Simulator** — Discount impact modelling with real ingredient costs
- **Process Flow** — Visual value-chain flowchart with cost mapping
- **Cost Analysis** — Detailed breakdowns, radar charts, trend lines
- **What-If Simulator** — Slider-based scenario modelling
- **Recommendations** — Data-driven suggestions based on cost patterns
- **Data Import** — CSV upload with column mapping for bulk data entry

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Express 5, TypeScript, Drizzle ORM |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Hosting | Vercel (serverless) |

---

## Local Development

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 2. Clone & install

```bash
git clone https://github.com/kfrem/RestaurantIQ
cd RestaurantIQ
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|----------|-----------------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (URI) |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / public key |

### 4. Push database schema

```bash
npm run db:push
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

---

## Deploy to Vercel

### Step-by-step

1. **Push to GitHub** (already done if you're reading this)

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **Import Git Repository** → select `kfrem/RestaurantIQ`
   - Framework Preset: **Other** (Vercel auto-detects `vercel.json`)

3. **Add environment variables**
   In Vercel → Project → Settings → Environment Variables, add all five variables from `.env.example`:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   Click **Deploy**. Vercel runs `npm run vercel-build` which:
   - Builds the React frontend → `dist/public/` (served as static files)
   - The `api/index.ts` is compiled by Vercel's Node.js runtime as a serverless function

5. **Done** — your app is live at `https://your-project.vercel.app`

### Architecture on Vercel

```
Browser → Vercel CDN → dist/public/index.html  (React SPA)
Browser → Vercel Fn  → api/index.ts            (Express API routes)
api/index.ts         → Supabase PostgreSQL      (Drizzle ORM)
```

---

## Currency & Theming

- Currency: **£ GBP** throughout
- Primary colour: orange (`hsl(24 95% 53%)`)
- Dark mode supported via class-based toggle
