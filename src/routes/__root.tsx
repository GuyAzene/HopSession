import React, { Suspense, useEffect } from 'react';
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import { useConvexAuth } from 'convex/react';
import type { ConvexReactClient } from 'convex/react'

import { BeerLoadingScreen } from '@/components/beer-loading-screen';
import { ErrorBoundary } from '@/components/error-boundary';
import { Navbar } from '@/components/navbar';
import { getSafeReturnTo } from '@/lib/auth-redirect';
import { router } from '@/main';

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
});

function RootComponent() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const loginSearch = useRouterState({ select: (s) => s.location.search });
    const isLoginRoute = pathname === '/login';
    const shouldRedirectToLogin = !isLoading && !isAuthenticated && !isLoginRoute;
    const shouldRedirectToHome = !isLoading && isAuthenticated && isLoginRoute;

    useEffect(() => {
        if (!shouldRedirectToLogin) {
            return;
        }

        void router.navigate({
            to: '/login',
            search: {
                returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
                error: undefined,
            },
            replace: true,
        });
    }, [shouldRedirectToLogin]);

    useEffect(() => {
        if (!shouldRedirectToHome) {
            return;
        }

        window.location.replace(getSafeReturnTo(
            typeof loginSearch === 'object' && loginSearch !== null && 'returnTo' in loginSearch
                ? loginSearch.returnTo
                : undefined,
        ));
    }, [loginSearch, shouldRedirectToHome]);

    if (isLoading) {
        return <BeerLoadingScreen />;
    }

    if (!isAuthenticated && isLoginRoute) {
        return (
            <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
                <Outlet />
            </div>
        );
    }

    if (shouldRedirectToLogin || shouldRedirectToHome) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col bg-brand-bg font-sans text-brand-text">
            {/* Navbar fetches its own user via useCurrentUser hook */}
            <Navbar />

            <main className="flex-1 p-4">
                {/* ErrorBoundary catches throws from Convex queries (e.g. auth errors) */}
                <ErrorBoundary key={pathname}>
                    <Outlet />
                </ErrorBoundary>
            </main>

            <Suspense fallback={null}>
                <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
        </div>
    );
}
