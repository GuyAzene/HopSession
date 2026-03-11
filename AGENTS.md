# AGENTS.md

Guidance for agentic coding tools working in `/Users/guy/Developer/HopSession`.

## Read First

Read `CLAUDE.md` before making changes. It is the primary repo-specific guide.
This repo does not contain `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md`.

## Project Snapshot

HopSession is a private beer-tasting event organizer with shared cost splitting.
The product is Hebrew-first and built for RTL usage.

Stack:
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Convex backend and database
- `@convex-dev/auth` for authentication
- TanStack Router with file-based routing
- Firecrawl + Cheerio for Untappd scraping in a Convex action

## Repository Layout

Important paths:
- `src/` - frontend app
- `src/routes/` - route files
- `src/components/` - app components
- `src/components/ui/` - reusable UI primitives
- `src/lib/` - helpers, hooks, types, utilities
- `convex/` - backend schema, queries, mutations, actions, auth helpers
- `convex/_generated/` - generated Convex files; never edit manually
- `src/routeTree.gen.ts` - generated route tree; never edit manually
- `src/index.css` - theme tokens and brand colors

## Architecture Notes

- The app is real-time; Convex queries update the UI reactively.
- Auth state comes from `useConvexAuth()`.
- `src/routes/__root.tsx` gates the app: guests see `WelcomeScreen`, authenticated users get `Navbar` and routed content.
- `src/main.tsx` wraps the app with `DirectionProvider dir="rtl"`, `ConvexAuthProvider`, and `RouterProvider`.
- Route files use `createFileRoute(...)`; the root route uses `createRootRouteWithContext(...)`.
- TanStack Router generates the route tree automatically.

Schema highlights from `convex/schema.ts`:
- `events` - beer tasting sessions
- `eventParticipants` - join table between users and events
- `drinks` - beers consumed within an event
- auth tables are injected via `authTables`

## Commands

Primary commands:

```bash
npm run dev
npx convex dev
npm run lint
npm run build
npm run preview
npx shadcn add <component>
```

What they do:
- `npm run dev` - start the Vite frontend dev server
- `npx convex dev` - start Convex backend watch/sync mode
- `npm run lint` - run `eslint .`
- `npm run build` - run `tsc -b && vite build`
- `npm run preview` - preview the production build locally

## Test Status

There is no configured test framework in `package.json`.
There are no `test`, `test:unit`, `test:e2e`, `vitest`, `jest`, or `playwright` scripts.
A repository search found no `*.test.*` or `*.spec.*` files.

Therefore:
- there is no supported run-all-tests command
- there is no supported single-test-file command
- there is no supported single-test-case command
- validation should rely on `npm run lint` and `npm run build`

Do not claim single-test execution exists until a real test runner is added.

## Validation Flow

For most changes:
1. Run `npm run lint`
2. Run `npm run build`
3. If backend logic changed, consider `npx convex dev`
4. If routes changed, verify routing still works after build

## Environment Variables

Known env vars:
- `VITE_CONVEX_URL` - frontend Convex deployment URL, usually in `.env.local`
- `FIRECRAWL_API_KEY` - required by the Untappd scraping action

Rules:
- `FIRECRAWL_API_KEY` must stay server-side
- never expose secrets in frontend code or committed files

## Generated Files

Never hand-edit:
- `src/routeTree.gen.ts`
- anything under `convex/_generated/`

If routes change, let the router plugin regenerate the tree.
If Convex signatures change, let Convex regenerate generated files.

## Code Style

### Formatting
- Indentation: 4 spaces
- Quotes: single quotes
- Semicolons: required
- Prefer ASCII unless the file already uses Hebrew or other non-ASCII text
- Match surrounding formatting when editing existing files

### Imports
Use this order:
1. External dependencies
2. Convex generated imports
3. Internal `@/...` imports
4. Relative imports, avoided when possible

Additional guidance:
- prefer `@/` aliases for frontend code under `src/`
- use `import type` for type-only imports
- avoid large import reordering unless already touching the file heavily

### TypeScript
The repo is strict. `tsconfig.app.json` and `tsconfig.node.json` enable `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, and `noEmit`.

Follow these rules:
- avoid `any`
- prefer `unknown` plus narrowing
- use Convex-generated types like `Id<'events'>`, `Doc<'drinks'>`, and API-derived types
- prefer explicit interfaces/types for non-trivial values
- use early returns to simplify control flow
- keep hooks before early returns when hook ordering matters

Patterns already used:
- `FunctionReturnType<typeof api.debts.getEventDebts>[number]`
- small local narrowing interfaces
- `getErrorMessage(error, fallback)`

### Naming
- React components: PascalCase
- Component files: kebab-case
- Hooks: `use...`
- Route files: TanStack Router naming, including `$param`
- Convex functions: descriptive verb-based names
- Constants: `UPPER_SNAKE_CASE`
- Utilities: descriptive camelCase

## Routing Conventions

- Add routes by creating files under `src/routes/`
- Dynamic segments use `$param`
- Do not edit `src/routeTree.gen.ts` manually
- Keep route params typed when passing them to Convex
- Preserve auth gating patterns in `src/routes/__root.tsx`
- Respect RTL layout expectations when changing route UI

## Frontend Conventions

- Use Tailwind classes for styling
- Use `cn()` from `@/lib/utils` for composed or conditional classes
- Reuse existing shadcn/ui primitives from `src/components/ui/`
- Reuse theme tokens from `src/index.css`
- Preserve Hebrew copy and RTL-friendly layout
- Keep both mobile and desktop behavior in mind

Brand tokens already used:
- `brand-bg`
- `brand-surface`
- `brand-text`
- `brand-success`
- `brand-error`
- `brand-blue`

UI patterns worth preserving:
- `Loader2` for loading states
- inline Hebrew error messaging in forms and dialogs
- dialogs/popovers built on shadcn primitives
- central auth/layout behavior through `DirectionProvider` and root routing

## Backend And Convex Conventions

- Backend files live in `convex/`
- Use generated server helpers from `convex/_generated/server`
- Validate args with `v` from `convex/values`
- Centralize auth/access logic in helpers like `requireAuth` and `requireEventAccess`
- Use indexes for lookup-heavy queries
- Keep queries, mutations, and actions focused and explicit
- Each query/mutation/action should verify auth independently
- Return `null` for expected not-found reads; throw when not-found or auth is a real error path

## Error Handling

Backend:
- use `throw new ConvexError('message')` for expected failures
- use `throw new Error('message')` for programmer or infrastructure failures

Frontend:
- query errors may bubble into `ErrorBoundary`
- mutations/actions should use `try/catch` and show visible UI errors
- use `getErrorMessage(error, fallback)` for consistent Convex error extraction
- never silently swallow failures

## Comments And Language

- Hebrew comments for user-facing or business-logic explanations
- English comments for technical explanations
- keep comments sparse
- prefer self-explanatory code and helper extraction
- comment only non-obvious constraints, edge cases, or tricky logic

## Authentication And Access Control

Preserve existing patterns:
- `requireAuth()` is the shared backend authentication gate
- `requireEventAccess()` checks event existence plus participant or owner access
- frontend auth gating lives in `src/routes/__root.tsx`
- invite flow preloads event details and redirects users already in the event

Do not re-implement ad hoc access checks if shared helpers already fit.

## Untappd / Firecrawl Integration

When touching `convex/drinks.ts`:
- authenticate before spending external API quota
- validate Untappd URLs strictly
- keep `FIRECRAWL_API_KEY` server-only
- convert scrape/parsing failures into the right error type for the layer

## Agent Workflow

When making changes:
- read `CLAUDE.md` first
- inspect adjacent files before inventing patterns
- prefer existing repo conventions over generic defaults
- avoid introducing a test framework unless explicitly requested
- do not claim a single-test command exists when it does not
- run `npm run lint` and `npm run build` when practical
- clearly state when validation could not be run
- never edit generated files by hand
- prefer small focused changes over broad refactors
- preserve Hebrew product copy unless the task requires changing it
