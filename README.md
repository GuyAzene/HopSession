# HopSession 🍻

HopSession is a private app for friends to create beer-tasting events, add drinks, and track shared expenses.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Routing: TanStack Router
- Styling: Tailwind CSS v4 + shadcn/ui
- Backend + DB: Convex
- Auth: Convex Auth (Google + Magic Link)

## Current Features

- Login with Google OAuth or email magic link
- Create tasting events
- View personal events feed
- Open event details page
- Add drinks manually or via Untappd scrape
- Server-side auth and event access checks
- Unified client/server error handling for user-facing failures

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
VITE_CONVEX_URL=your-convex-deployment-url
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

3. Start Convex backend:

```bash
npx convex dev
```

4. Start Vite frontend:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check and build production assets
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Next Planned Work

- Expense/debt calculation logic (replace placeholder debt cards)
- Participants management per event
- Event-level settlement flow
- Pagination/infinite feed for large event history
