import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';

// Uses real local Convex tables and HTTP auth handlers. Never sends email.
const envText = readFileSync('.env.local', 'utf8');
const deployment = envText.match(/^CONVEX_DEPLOYMENT=(anonymous:[^\s#]+)/m)?.[1];
assert(deployment, 'Rehearsal requires an anonymous local Convex deployment');
const config = JSON.parse(readFileSync('.convex/local/default/config.json', 'utf8'));
assert.equal(deployment, `anonymous:${config.deploymentName}`);
const cloudUrl = `http://127.0.0.1:${config.ports.cloud}`;
const siteUrl = `http://127.0.0.1:${config.ports.site}`;
assert(envText.includes(`VITE_CONVEX_URL=${cloudUrl}`));
const cliEnv = {
    ...process.env,
    CONVEX_DEPLOYMENT: deployment,
    CONVEX_DEPLOY_KEY: '',
    CONVEX_SELF_HOSTED_URL: '',
    CONVEX_SELF_HOSTED_ADMIN_KEY: '',
};
const fixtureDir = mkdtempSync(join(tmpdir(), 'hopsession-auth-rehearsal-'));
function cli(args, input) {
    try {
        return execFileSync('npx', ['convex', ...args], {
            encoding: 'utf8', env: cliEnv, input, stdio: ['pipe', 'pipe', 'pipe'],
        });
    } catch (error) {
        throw new Error(String(error.stderr || error.message));
    }
}
function run(name, args = {}, component) {
    return JSON.parse(cli(['run', name, JSON.stringify(args), ...(component ? ['--component', component] : [])]));
}
function rows(table, component) {
    const output = cli(['data', table, '--format', 'json', '--limit', '1000',
        ...(component ? ['--component', component] : [])]);
    return output.trim() ? JSON.parse(output) : [];
}
function append(table, documents) {
    const file = join(fixtureDir, `${table}-${randomBytes(4).toString('hex')}.json`);
    writeFileSync(file, JSON.stringify(documents));
    cli(['import', '--append', '--table', table, file]);
}
function setEnv(name, value) {
    cli(['env', 'set', name], value);
}
function componentCreate(model, data) {
    return run('adapter:create', { input: { model, data } }, 'betterAuth');
}
async function authRequest(path, options = {}) {
    return fetch(`${siteUrl}/api/auth${path}`, {
        redirect: 'manual', ...options,
        headers: { Origin: 'http://localhost:5173', ...options.headers },
    });
}

for (const table of ['users', 'events', 'eventParticipants', 'drinks', 'authAccounts']) {
    assert.equal(rows(table).length, 0, `Refusing to modify a nonempty ${table} table; use a fresh local deployment`);
}
assert.equal(rows('user', 'betterAuth').length, 0, 'Use an empty Better Auth component');
setEnv('SITE_URL', 'http://localhost:5173');
setEnv('AUTH_GOOGLE_ID', 'local-rehearsal');
setEnv('AUTH_GOOGLE_SECRET', 'local-rehearsal');
setEnv('BETTER_AUTH_SECRET', randomBytes(32).toString('base64'));
setEnv('AUTH_MIGRATION_COMPLETE', 'false');

append('users', Array.from({ length: 28 }, (_, index) => ({
    email: `person${index}@migration.invalid`, name: `Original profile ${index}`,
    phone: `050000${String(index).padStart(4, '0')}`, emailVerificationTime: 123,
})));
const beforeUsers = rows('users').sort((a, b) => a.email.localeCompare(b.email));
const [owner, participant, outsider] = beforeUsers;
append('authAccounts', beforeUsers.flatMap((user, index) => [
    { userId: user._id, provider: 'resend', providerAccountId: user.email, emailVerified: user.email },
    ...(index < 2 ? [{ userId: user._id, provider: 'google', providerAccountId: `google-${index}`, emailVerified: user.email }] : []),
]));
append('events', [{ name: 'Migration rehearsal', date: Date.now(), ownerId: owner._id, isSettled: false }]);
const event = rows('events')[0];
append('eventParticipants', [owner, participant].map((user) => ({ eventId: event._id, userId: user._id })));
append('drinks', [{ eventId: event._id, payerId: owner._id, consumers: [owner._id, participant._id], beerName: 'Fixture', price: 100 }]);
const beforeData = Object.fromEntries(['events', 'eventParticipants', 'drinks', 'authAccounts']
    .map((table) => [table, rows(table)]));

assert.equal((await authRequest('/sign-in/social', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'google' }),
})).status, 503, 'Maintenance must block authentication');
assert.deepEqual(run('authMigration:inventory').issues, []);
for (let pass = 0; pass < 2; pass++) {
    let cursor = null;
    let createdUsers = 0;
    let createdAccounts = 0;
    do {
        const page = run('authMigration:migratePage', { cursor });
        createdUsers += page.createdUsers;
        createdAccounts += page.createdAccounts;
        cursor = page.cursor;
    } while (cursor);
    assert.equal(createdUsers, pass === 0 ? 28 : 0);
    assert.equal(createdAccounts, pass === 0 ? 2 : 0);
}
const report = run('authMigration:inventory');
assert.deepEqual(report, { users: 28, linkedUsers: 28, googleAccounts: 2, linkedGoogleAccounts: 2, issues: [] });
const migratedUsers = rows('users').sort((a, b) => a.email.localeCompare(b.email));
assert.deepEqual(migratedUsers.map(({ betterAuthId, authEmail, ...user }) => {
    assert(betterAuthId);
    assert.equal(authEmail, user.email);
    return user;
}), beforeUsers, 'Original user IDs and profile fields must be unchanged');
for (const [table, documents] of Object.entries(beforeData)) assert.deepEqual(rows(table), documents);
console.log('PASS: two-page import, repeat import, original profiles and all business records preserved');

setEnv('AUTH_MIGRATION_COMPLETE', 'true');
async function magicSession(email, expiresAt = Date.now() + 60_000) {
    const token = randomBytes(24).toString('hex');
    componentCreate('verification', {
        identifier: createHash('sha256').update(token).digest('base64url'),
        value: JSON.stringify({ email }), expiresAt, createdAt: Date.now(), updatedAt: Date.now(),
    });
    const query = new URLSearchParams({ token, callbackURL: `http://localhost:5173/invite/${event._id}`,
        errorCallbackURL: 'http://localhost:5173/login' });
    const path = `/magic-link/verify?${query}`;
    const response = await authRequest(path);
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get('location'));
    return { path, location };
}
async function login(email) {
    const { path, location } = await magicSession(email);
    assert.equal(location.pathname, `/invite/${event._id}`);
    assert(location.searchParams.get('ott'), 'Cross-domain callback must include a one-time token');
    const exchange = await authRequest('/cross-domain/one-time-token/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'better-auth-cookie': '' },
        body: JSON.stringify({ token: location.searchParams.get('ott') }),
    });
    assert.equal(exchange.status, 200);
    const cookies = exchange.headers.get('set-better-auth-cookie');
    assert(cookies, 'SPA must receive its session cookie');
    const tokenResponse = await authRequest('/convex/token', { headers: { 'better-auth-cookie': cookies } });
    assert.equal(tokenResponse.status, 200);
    const { token } = await tokenResponse.json();
    const client = new ConvexHttpClient(cloudUrl, { logger: false });
    client.setAuth(token);
    return { client, cookies, path };
}
const ownerSession = await login(owner.email);
assert.equal((await ownerSession.client.query('users:current', {}))._id, owner._id);
await ownerSession.client.mutation('users:updateProfile', { name: 'Updated local profile', phone: '0500000000' });
assert.equal((await ownerSession.client.query('users:current', {})).name, 'Updated local profile');
assert.equal(rows('users').find((user) => user._id === participant._id).name, participant.name);
await assert.rejects(ownerSession.client.action('drinks:scrapeUntappdBeer', { untappdUrl: 'invalid' }),
    /קישור|כתובת/, 'Authenticated actions must pass identity resolution and reach URL validation');
assert.deepEqual(await ownerSession.client.query('debts:getEventDebts', { eventId: event._id }), [
    { from: participant._id, to: owner._id, amount: 50 },
]);
assert.equal((await ownerSession.client.query('events:getInviteDetails', { eventId: event._id })).alreadyParticipant, true);
const reused = await authRequest(ownerSession.path);
assert.equal(new URL(reused.headers.get('location')).searchParams.get('error'), 'INVALID_TOKEN');
const expired = await magicSession(owner.email, Date.now() - 1000);
assert.equal(expired.location.searchParams.get('error'), 'INVALID_TOKEN');
const outsideSession = await login(outsider.email);
await assert.rejects(outsideSession.client.query('debts:getEventDebts', { eventId: event._id }));
const guest = new ConvexHttpClient(cloudUrl, { logger: false });
await assert.rejects(guest.mutation('users:updateProfile', { name: 'Unauthorized' }), /חובה להתחבר/);
await assert.rejects(guest.action('drinks:scrapeUntappdBeer', { untappdUrl: 'https://untappd.com/b/example/1' }), /חובה להתחבר/);
const newSession = await login('new@migration.invalid');
assert.equal((await newSession.client.query('users:current', {})).email, 'new@migration.invalid');
assert.equal(rows('users').filter((user) => user.email === 'new@migration.invalid').length, 1);
assert.equal(rows('account', 'betterAuth').filter((account) => account.providerId === 'google').length, 2,
    'Signing in by magic link must preserve the imported Google accounts');
const signOut = await authRequest('/sign-out', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'better-auth-cookie': ownerSession.cookies }, body: '{}',
});
assert.equal(signOut.status, 200);
assert.equal(await ownerSession.client.query('users:current', {}), null, 'Revoked session must fail even with an unexpired JWT');
console.log('PASS: real magic-link verification, OTT exchange, Convex JWT, old/new identities, debt result, access denial, expiry/reuse, and logout');

setEnv('AUTH_MIGRATION_COMPLETE', 'false');
append('users', [{ email: owner.email.toUpperCase(), name: 'Duplicate fixture' }, { name: 'Missing email fixture' }]);
append('authAccounts', [{ userId: outsider._id, provider: 'google', providerAccountId: 'google-0' }]);
const conflicts = run('authMigration:inventory').issues;
assert(conflicts.some((issue) => issue.includes('duplicate normalized email')));
assert(conflicts.some((issue) => issue.includes('missing or invalid email')));
assert(conflicts.some((issue) => issue.includes('duplicate provider identity')));
const authCount = rows('user', 'betterAuth').length;
assert.throws(() => run('authMigration:migratePage'), /Migration blocked/);
assert.equal(rows('user', 'betterAuth').length, authCount);
console.log('PASS: conflicts block migration before writes. Local fixture data retained; authentication left in maintenance mode.');
