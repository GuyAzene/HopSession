import React, { Suspense } from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useConvexAuth } from "convex/react"

import { WelcomeScreen } from "@/components/welcome-screen"
import { Navbar } from "@/components/navbar"
import { ErrorBoundary } from "@/components/error-boundary"

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

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-text">
                <p className="text-brand-text/70 animate-pulse text-lg font-medium">מוזג בירה... 🍺</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
                <WelcomeScreen />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col">
            {/* Navbar fetches its own user via useCurrentUser hook */}
            <Navbar />

            <main className="flex-1 p-4">
                {/* ErrorBoundary catches throws from Convex queries (e.g. auth errors) */}
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>

            <Suspense fallback={null}>
                <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
        </div>
    )
}
