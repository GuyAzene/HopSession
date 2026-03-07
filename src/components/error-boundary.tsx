import React from 'react';

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

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                    <p className="text-lg font-semibold text-brand-error">
                        {this.state.error?.message ?? 'שגיאה לא צפויה'}
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
