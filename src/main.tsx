import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { RouterProvider, createRouter } from '@tanstack/react-router';

// ייבוא עץ הניתובים שנוצר אוטומטית על ידי הפלאגין של TanStack
import { routeTree } from './routeTree.gen';
import "./index.css";

// 1. הגדרת ה-Convex Client (כפי שהיה לך)
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// 2. יצירת ה-Router Instance
const router = createRouter({ routeTree });

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
                <ConvexAuthProvider client={convex}>
                    <RouterProvider router={router} />
                </ConvexAuthProvider>
            </DirectionProvider>
        </StrictMode>
    );
}