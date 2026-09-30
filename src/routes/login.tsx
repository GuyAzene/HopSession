import { createFileRoute } from '@tanstack/react-router';

import { LoginForm } from '@/components/login-form';
import { getSafeReturnTo } from '@/lib/auth-redirect';

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>) => ({
        returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
        error: typeof search.error === 'string' ? search.error : undefined,
    }),
    component: LoginRoute,
});

function LoginRoute() {
    const search = Route.useSearch();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
            <div className="text-center">
                <h1 className="text-5xl font-black tracking-tight text-brand-text">
                    HopSession 🍻
                </h1>
                <p className="mt-3 font-medium text-brand-text/70">
                    מחלקים את החשבון, שומרים על האווירה.
                </p>
            </div>

            <div className="flex w-full max-w-sm flex-col items-center gap-4">
                <LoginForm
                    className="w-full"
                    returnTo={getSafeReturnTo(search.returnTo)}
                    initialError={search.error}
                />
            </div>
        </div>
    );
}
