# Retirement Calculator

A Next.js app that projects your net worth over time using saved retirement scenarios.

## Stack

- **Next.js** (React + API routes)
- **SQLite** (local database file)
- **Drizzle ORM**
- **Recharts** (projection chart)

## Getting started

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration fields

Each scenario stores:

- **Name** (required)
- **Description** (optional notes)
- **Location** (optional, e.g. "Austin, TX")
- **Current age** as years + months (0-11)
- **Retirement age** and **life expectancy** (whole years)
- Financial assumptions: net worth, income, expenses, return rate, inflation

Current age supports month precision (e.g. 35 years, 6 months). Projections start at that fractional age and step forward one year at a time.

## How it works

1. Create a **scenario** with your age, income, expenses, return rate, and inflation assumptions.
2. The app runs a year-by-year projection from your current age through life expectancy.
3. While working, annual savings (`income - expenses`) are added and inflated each year.
4. After retirement, expenses are drawn down and the remaining balance grows at your return rate.

## API routes (internal)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/configurations` | List scenarios |
| POST | `/api/configurations` | Create scenario |
| GET | `/api/configurations/[id]` | Get one scenario |
| PUT | `/api/configurations/[id]` | Update scenario |
| DELETE | `/api/configurations/[id]` | Delete scenario |
| GET | `/api/configurations/[id]/projection` | Run projection |

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run db:push` — sync SQLite schema
- `npm run db:seed` — add a sample scenario
