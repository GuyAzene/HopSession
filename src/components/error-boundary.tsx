import React from 'react';
import { ConvexError } from 'convex/values';
import { Home } from 'lucide-react';
import { router } from '@/main';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// React error boundaries must be class components — they catch errors thrown
// by useQuery (e.g. when a Convex query throws for auth/not-found)
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        router.navigate({ to: '/' });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            const { error } = this.state;
            const message = error instanceof ConvexError
                ? String(error.data)
                : (error?.message ?? 'שגיאה לא צפויה');
            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-lg font-semibold text-brand-error">
                        {message}
                    </p>
                    <button
                        onClick={this.handleGoHome}
                        className="bg-brand-text text-brand-bg hover:bg-brand-text/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        חזור לדף הבית
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
