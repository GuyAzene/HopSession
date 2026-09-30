import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import type { AuthClient } from '@convex-dev/better-auth/react';
import { ConvexReactClient } from "convex/react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { RouterProvider, createRouter } from '@tanstack/react-router';

import { authClient } from '@/lib/auth-client';
// ייבוא עץ הניתובים שנוצר אוטומטית על ידי הפלאגין של TanStack
import { routeTree } from './routeTree.gen';
import "./index.css";

// 1. הגדרת ה-Convex Client (כפי שהיה לך)
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// 2. יצירת ה-Router Instance
export const router = createRouter({
    routeTree,
    context: {
        convex: undefined!, // typed placeholder
    },
});

// 3. חיבור ה-Router ל-TypeScript (בשביל Type-safety בקישורים)
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <DirectionProvider dir="rtl">
                <ConvexBetterAuthProvider
                    client={convex}
                    // The provider's AuthClient type does not retain additional Better Auth plugins.
                    authClient={authClient as unknown as AuthClient}
                >
                    <RouterProvider router={router} context={{convex}}/>
                </ConvexBetterAuthProvider>
            </DirectionProvider>
        </StrictMode>
    );
}
