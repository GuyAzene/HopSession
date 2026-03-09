import React, { Suspense } from 'react'
import {Outlet, createRootRouteWithContext} from '@tanstack/react-router'
import { useConvexAuth } from "convex/react"
import type { ConvexReactClient } from 'convex/react'

import { WelcomeScreen } from "@/components/welcome-screen"
import { Navbar } from "@/components/navbar"
import { ErrorBoundary } from "@/components/error-boundary"
import { BeerLoadingScreen } from '@/components/beer-loading-screen'

// טוען את ה-Devtools רק אם אנחנו לא בסביבת פרודקשן (חוסך המון משקל מהקוד החי!)
const TanStackRouterDevtools = import.meta.env.PROD
    ? () => null // בפרודקשן - אל תרנדר כלום
    : React.lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
            default: res.TanStackRouterDevtools,
        }))
    )

interface RouterContext {
    convex: ConvexReactClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})
function RootComponent() {
    const { isAuthenticated, isLoading } = useConvexAuth();

    if (isLoading) {
        return <BeerLoadingScreen />;
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
