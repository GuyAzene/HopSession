const DEFAULT_RETURN_TO = '/';

export function getSafeReturnTo(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
        return DEFAULT_RETURN_TO;
    }

    try {
        const url = new URL(value, window.location.origin);
        if (url.origin !== window.location.origin || url.pathname === '/login') {
            return DEFAULT_RETURN_TO;
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return DEFAULT_RETURN_TO;
    }
}

export function getAuthCallbackUrl(returnTo: string): string {
    return new URL(getSafeReturnTo(returnTo), window.location.origin).toString();
}

export function getAuthErrorCallbackUrl(returnTo: string): string {
    const url = new URL('/login', window.location.origin);
    const safeReturnTo = getSafeReturnTo(returnTo);
    if (safeReturnTo !== DEFAULT_RETURN_TO) {
        url.searchParams.set('returnTo', safeReturnTo);
    }
    return url.toString();
}
