# HopSession 🍻

HopSession is a private app for friends to create beer-tasting events, add drinks, and track shared expenses.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Routing: TanStack Router
- Styling: Tailwind CSS v4 + shadcn/ui
- Backend + DB: Convex
- Auth: Better Auth on Convex (Google + Magic Link)

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

2. Copy `.env.example` to `.env.local` and select your Convex deployment. Set server secrets on the Convex deployment:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

See [authentication setup and migration](docs/auth-migration.md) for Google/Resend credentials, trusted origins, and the required migration gate. Existing deployments must complete the account import before enabling authentication.

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
