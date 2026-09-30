# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Notes

- `notes.md` is a gitignored local notes file for future ideas, follow-ups, cleanup opportunities, and low-priority risks.
- Read `notes.md` when the user asks for future work ideas, non-urgent improvements, cleanup opportunities, or general product/technical considerations.
- Do not treat `notes.md` as a changelog or source of truth; it is lightweight planning context.

## Commands

```bash
# Development (run both concurrently)
npm run dev              # Start Vite frontend dev server
npx convex dev           # Start Convex backend in watch mode

# Build & Lint
npm run build            # tsc -b && vite build
npm run lint             # ESLint on all files
npm run preview          # Preview production build

# Add shadcn/ui components
npx shadcn add <component>   # Installs to src/components/ui/
```

No test framework is configured.

## Architecture

HopSession is a private beer-tasting event organizer with cost splitting (Splitwise for beer). The app is in Hebrew with RTL layout.

**Frontend** (`src/`): React 19 + TypeScript, Vite, Tailwind v4, shadcn/ui
**Backend** (`convex/`): Convex (serverless DB + backend), Better Auth via `@convex-dev/better-auth` for authentication
**Routing**: TanStack Router with file-based routing — routes live in `src/routes/`, the route tree is auto-generated to `src/routeTree.gen.ts` (never edit manually)

### Data Flow

The app is fully real-time via Convex. Components use `useQuery` for reactive reads and `useMutation`/`useAction` for writes. Auth state comes from `useConvexAuth`. The root route (`src/routes/__root.tsx`) redirects guests to `/login` while preserving a validated return destination; authenticated users get `Navbar` + `<Outlet>`. `ConvexBetterAuthProvider` wraps the app. Backend `getAppUserId` resolves a session-validated Better Auth identity to the original app `users` ID; `requireAuth` and `requireEventAccess` remain the shared access helpers.

### Database Schema (`convex/schema.ts`)

- `events` — beer tasting sessions (name, date, ownerId, isSettled)
- `eventParticipants` — join table with indexes `by_user`, `by_event`, `by_event_and_user`
- `drinks` — beers consumed at an event (beerName, price, payerId, consumers[], optional Untappd metadata)
- App `users` retain original IDs/profile fields, plus indexed `betterAuthId` and normalized `authEmail` mappings
- Better Auth records live in its Convex component; legacy auth tables remain for rollback

### Untappd Integration

`convex/drinks.ts` has a `scrapeUntappdBeer` **action** that uses Firecrawl API (requires `FIRECRAWL_API_KEY` env var on Convex) to fetch HTML and Cheerio to parse beer metadata.

### Environment Variables

- `VITE_CONVEX_URL` — Convex deployment URL (frontend, in `.env.local`)
- `VITE_CONVEX_SITE_URL` — Convex HTTP auth URL (frontend)
- Server: `SITE_URL`, `BETTER_AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`
- `AUTH_MIGRATION_COMPLETE` — authentication is disabled unless exactly `true`; see `docs/auth-migration.md` before enabling
- `FIRECRAWL_API_KEY` — for Untappd scraping (set in Convex dashboard)

See `docs/auth-migration.md` for the internal inventory/import commands, rollback requirements, and the standalone local integration rehearsal. Do not upgrade Better Auth to 1.7 with adapter 0.12.5.

## Code Style

- **Indentation:** 4 spaces
- **Quotes:** Single quotes, semicolons required
- **Components:** Named exports, PascalCase; files in kebab-case
- **Styling:** Always use `cn()` from `@/lib/utils` for conditional classes
- **Brand colors** (defined in `src/index.css`): `brand-bg` (#FFECCC), `brand-surface`, `brand-text`, `brand-success`, `brand-error`, `brand-blue`
- **Comments:** Hebrew for user-facing/business logic, English for technical
- **Convex queries:** Return `null` for not-found rather than throwing; use early returns for guard clauses
- **TypeScript:** Strict mode; avoid `any`, use `unknown` with type guards

### Import Order

1. External deps (React, third-party)
2. Convex generated (`../../convex/_generated/api`)
3. Internal aliases (`@/components/...`, `@/lib/...`)
4. Relative imports (avoid when possible)

### Adding Routes

Create a new file in `src/routes/` — TanStack Router plugin auto-generates the tree. Dynamic routes use `$param` syntax (e.g., `event.$eventId.tsx`).

## Error Handling

### Backend (`convex/`)
- `throw new ConvexError("message")` — expected failures: auth, not found, no permission, validation. Import from `"convex/values"`.
- `throw new Error("message")` — developer bugs / infrastructure (bad env var, external API down, parsing failure).

### Frontend (`src/`)
- Queries throwing → caught by **ErrorBoundary** — show `error instanceof ConvexError ? error.data : error.message ?? "שגיאה לא צפויה"`
- Mutations/Actions → `try/catch` — always surface error to UI, never silently swallow
- Check `error instanceof ConvexError` to show `error.data` directly; otherwise show generic fallback message
