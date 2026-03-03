import React, { Suspense } from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useConvexAuth, useQuery } from "convex/react"

// ייבוא הקומפוננטות שלך וה-API
import { api } from "../../convex/_generated/api"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Navbar } from "@/components/navbar"

// טוען את ה-Devtools רק אם אנחנו לא בסביבת פרודקשן (חוסך המון משקל מהקוד החי!)
const TanStackRouterDevtools = import.meta.env.PROD
    ? () => null // בפרודקשן - אל תרנדר כלום
    : React.lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
            default: res.TanStackRouterDevtools,
        }))
    )

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const { isAuthenticated, isLoading } = useConvexAuth();

    // שולפים את המשתמש פה כדי להעביר ל-Navbar
    const user = useQuery(api.users.current);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-text">
                <p className="text-brand-text/70 animate-pulse text-lg font-medium">מוזג בירה... 🍺</p>
            </div>
        );
    }

    // אם לא מחוברים, מציגים את מסך הפתיחה במעטפת שלנו
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
                <WelcomeScreen />
            </div>
        );
    }

    // אם מחוברים, מציגים את ה-Dashboard (נאבבאר + תוכן משתנה)
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col">
            <Navbar user={user} />

            <main className="flex-1 p-4">
                {/* ה-Outlet שואב לתוכו את עמוד הבית (EventsFeed) או את עמוד האירוע */}
                <Outlet />
            </main>

            {/* כלי הפיתוח של הראוטר (מופיעים רק ב-dev ונטענים בעצלות) */}
            <Suspense fallback={null}>
                <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
        </div>
    )
}