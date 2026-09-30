export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing server environment variable: ${name}`);
    return value;
}

export function authIsReady(): boolean {
    return process.env.AUTH_MIGRATION_COMPLETE === 'true';
}

export function getAuthTrustedOrigins(): string[] {
    const siteUrl = requireEnv('SITE_URL');
    return siteUrl === 'https://hopsession.cc'
        ? [siteUrl, 'https://www.hopsession.cc', 'https://hopsession.pages.dev']
        : [siteUrl];
}

export function normalizeAuthEmail(email: string): string {
    return email.trim().toLowerCase();
}
