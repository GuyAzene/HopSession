# AGENTS.md - HopSession Coding Guidelines

## Commands

```bash
# Development
npm run dev                 # Start Vite dev server
npx convex dev             # Start Convex backend in watch mode

# Build & Lint
npm run build              # Build for production (tsc + vite build)
npm run lint               # Run ESLint on all files
npm run preview            # Preview production build
```

**Note:** No test framework is currently configured. Consider adding Vitest or Jest if tests are needed.

## Project Structure

```
HopSession/
├── src/                   # React frontend
│   ├── components/        # React components
│   │   └── ui/           # shadcn/ui components (auto-generated)
│   ├── lib/              # Utilities
│   ├── main.tsx          # Entry point
│   └── App.tsx           # Root component
├── convex/               # Backend (Convex)
│   ├── _generated/       # Auto-generated Convex types
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Authentication
│   └── *.ts              # Queries, mutations, actions
└── components.json       # shadcn/ui config
```

## Code Style

### General
- **Language:** TypeScript (strict mode)
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Indentation:** 4 spaces
- **Line endings:** Unix-style (LF)

### Imports
```typescript
// 1. External dependencies (React, third-party)
import * as React from "react";
import { useState } from "react";
import { useQuery } from "convex/react";

// 2. Convex generated code
import { api } from "../../convex/_generated/api";
import { query } from "./_generated/server";

// 3. Internal aliases (@/*)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 4. Relative imports (avoid when possible)
import { MyComponent } from "./my-component";
```

### Naming Conventions
- **Components:** PascalCase (`LoginForm`, `UserCard`)
- **Files:** kebab-case for components (`login-form.tsx`)
- **Functions:** camelCase (`handleSubmit`, `getUser`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Types:** PascalCase with descriptive names
- **Convex queries/mutations:** camelCase (`getCurrent`, `createEvent`)

### React Components
```typescript
// Prefer named exports for components
export function Dashboard() {
    // Component logic
}

// Props interface
interface ButtonProps {
    variant?: "default" | "outline";
    onClick?: () => void;
}

// Use shadcn/ui pattern for UI components
import { cn } from "@/lib/utils";
```

### Tailwind & Styling
- Always use `cn()` utility from `@/lib/utils` for conditional classes
- Custom color: `#FFECCC` (app background)
- RTL support is enabled globally via `DirectionProvider`
- Use Tailwind v4 syntax (no config file needed)

### Convex Backend
```typescript
// Queries - read-only
import { query } from "./_generated/server";

export const getUser = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Mutations - write operations
import { mutation } from "./_generated/server";

export const createEvent = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("events", args);
    },
});
```

### Error Handling
- Use early returns for guard clauses
- Return `null` for "not found" in queries rather than throwing
- Use Convex's built-in error handling for auth failures

### TypeScript
- Enable strict mode (already configured)
- Use explicit return types for public functions
- Avoid `any` - use `unknown` with type guards if needed
- Leverage Convex's generated types for database operations

### Comments
- Use Hebrew for user-facing text and business logic comments
- Use English for technical comments and documentation
- Keep comments concise and meaningful

## Adding shadcn/ui Components

```bash
npx shadcn add button
npx shadcn add card
# etc.
```

Components are installed to `src/components/ui/` and follow shadcn conventions.

## Environment Setup

Required environment variable:
```
VITE_CONVEX_URL=your-convex-url
```
