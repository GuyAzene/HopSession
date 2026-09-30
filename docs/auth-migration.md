# Better Auth migration

HopSession uses `@convex-dev/better-auth@0.12.5` and `better-auth@1.6.30` with Google and Resend magic links. The adapter requires Better Auth `<1.7.0`; do not upgrade Better Auth independently. The lockfile resolves Convex to 1.45.0.

Better Auth stores authentication in its Convex component. The app retains the original `users` IDs and profile fields. `users.betterAuthId` maps identities; `authEmail` is the normalized email used to prevent duplicate provisioning. Events, participants, drinks, and debt references never change. New users are provisioned by a transactional trigger. Existing names and phone numbers remain app-owned.

## Configuration

Copy `.env.example` to `.env.local` and select the intended deployment. The frontend needs both `VITE_CONVEX_URL` (queries) and `VITE_CONVEX_SITE_URL` (HTTP auth).

Set the following **server-side Convex environment variables**:

| Variable | Value |
| --- | --- |
| `SITE_URL` | Exact frontend origin, e.g. `https://hopsession.cc` or `http://localhost:5173` |
| `BETTER_AUTH_SECRET` | Random secret, generated with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Existing Google OAuth credentials |
| `AUTH_RESEND_KEY` | Existing Resend API key |
| `AUTH_MIGRATION_COMPLETE` | `false` during migration; `true` only after verification |
| `FIRECRAWL_API_KEY` | Existing server-only scrape key |

For example, pipe a generated secret directly into the CLI without logging it:

```sh
openssl rand -base64 32 | npx convex env set BETTER_AUTH_SECRET
```

Add `https://<deployment>.convex.site/api/auth/callback/google` to the Google OAuth client's authorized redirect URIs. Keep the old callback during the rollback window. Configure development and production separately. Trust only the specific frontend origin; arbitrary preview origins are not enabled.

Authentication is closed unless `AUTH_MIGRATION_COMPLETE` is exactly `true`. The gate blocks auth endpoints (except public JWKS) and application access. It permits internal migration operations. Magic links expire after 15 minutes; tokens are stored hashed. Email sending is awaited, with a visible error on failure. No email or Google credentials are bundled into the frontend.

## Import procedure

These commands default to the selected development deployment. Do not add `--prod` until a production cutover is separately authorized and the deployment has been verified.

1. Back up the application and component data, record the previous release, and prepare a rollback build as described below. Pause legacy sign-ins and writes during the final production switch. Deploy this backend with the migration gate closed.
2. Run the **read-only** inventory:

   ```sh
   npx convex run authMigration:inventory '{}'
   ```

   It checks normalized email collisions, missing/anonymous users, missing/unsupported/duplicate provider identities, email aliases, orphan accounts, and existing Better Auth mapping conflicts. Resolve every issue explicitly; the importer does not merge users, change emails, or guess identity ownership. Inventory output contains record IDs, not secrets. It paginates database reads but assembles identity maps in action memory; use only after rehearsing on a representative export.
3. Start the import:

   ```sh
   npx convex run authMigration:migratePage '{}'
   ```

   If `isDone` is false, pass the returned cursor verbatim:

   ```sh
   npx convex run authMigration:migratePage '{"cursor":"<returned cursor>"}'
   ```

   Each call repeats the inventory before importing up to 25 users in one transaction, including component writes. Google identities retain their original provider account IDs. Verified-email evidence is preserved; unsupported identities block the operation. Email authentication does not need a Better Auth provider-account row. Never invoke `importPage` directly: `migratePage` supplies the full preflight check.
4. Repeat from the beginning. Every page must report zero new users/accounts. Run inventory again: no issues, `linkedUsers === users`, and `linkedGoogleAccounts === googleAccounts`.
5. Compare snapshots: all original user IDs/profile values and every event, participant, and drink record must be unchanged. The only app changes are the two mapping fields. Verify representative debt results.
6. Deploy the matching frontend. Set `AUTH_MIGRATION_COMPLETE=true` only after all checks pass. Smoke-test existing Google and email users, a new account, invite return destinations, profile editing, logout, refresh, and expiry before reopening access. Existing browser sessions and previously sent magic links are not migrated; users sign in again.

No command here deletes legacy tables or data. Legacy auth tables are explicitly defined in `legacyAuthTables.ts`; the old auth packages and endpoints are removed.

## Recovery

Production authentication trusts `https://hopsession.cc`, `https://www.hopsession.cc`, and `https://hopsession.pages.dev` when `SITE_URL=https://hopsession.cc`. These are the existing first-party Pages domains. Staging and local deployments trust only their configured `SITE_URL`; preview branches are not implicitly trusted.

An interrupted page rolls back its component and app writes together. Resume with the last successful cursor or start again from the beginning. Completed pages are idempotent. Keep authentication closed until the final inventory passes.

Before reopening production, prepare a **compatible rollback build** from the previous release: retain the new optional `betterAuthId`/`authEmail` user fields and indexes, keep the Better Auth component registered, and restore the old authentication handlers/provider/dependencies. A bare redeploy of the previous schema will reject the added user fields. Do not remove the component or restore a database snapshot over new event writes.

Rollback is simplest before reopening signups. If new users have registered only through Better Auth, their identities require a separately checked reverse migration before restoring legacy auth. Leave the gate closed and repair forward in that case. Retire legacy tables, keys, and callbacks in a separate cleanup after the rollback window.

## Validation

```sh
npm run lint
npm run build
npx convex codegen --typecheck enable
```

There is no unit/e2e test framework. A standalone integration rehearsal runs against real local Convex without sending email or contacting Google:

```sh
CONVEX_AGENT_MODE=anonymous npx convex dev --local-cloud-port 3320 --local-site-port 3321
# In another terminal, with the local backend running:
node scripts/rehearse-auth-migration.mjs
```

Use a fresh anonymous deployment with empty application and Better Auth user tables. The script refuses a cloud deployment or nonempty fixture tables. It creates 28 users, legacy Google/email accounts, an event, participants, and a drink; imports twice across pages; compares original data; verifies the expected debt; exercises real magic-link verification, one-time-token exchange, JWT authentication, new-user provisioning, rejected access, expired/reused links, and logout. It finally inserts deliberate conflicts and proves migration refuses writes. Local fixture data is retained and authentication is left in maintenance mode. The script configures dummy Google credentials and a fresh secret only on that local deployment.

Complete browser Google OAuth and Resend delivery checks separately using a configured development deployment. The local rehearsal seeds hashed verification tokens to test the HTTP flow; it cannot validate external provider configuration or email delivery.

### Local verification record (2026-09-08)

- Lint, production build, Convex code generation/type checking, and whitespace checks passed.
- The integration rehearsal passed: 28 users across two pages, zero new records on rerun, preserved profiles/business data, expected 50-shekel debt, real HTTP authentication and rejection scenarios.
- Additional checks verified profile updates, authenticated action identity propagation, and preservation of imported Google accounts after email login.
- Chrome verification returned an email login to the invited event, retained the session after refresh, and returned to the Hebrew login screen on logout.
- Lint retains four baseline warnings in generated files. The main frontend bundle is now about 516 kB uncompressed (164 kB gzip), exceeding Vite's 500 kB warning threshold.
- `npm audit` reports 22 findings (including one critical) in dependencies whose locked versions are unchanged by this migration. No broad dependency cleanup was applied.

References: [Convex React integration](https://labs.convex.dev/better-auth/framework-guides/react), [transactional triggers](https://labs.convex.dev/better-auth/features/triggers), [authorization](https://labs.convex.dev/better-auth/basic-usage/authorization).

## Optional hosted auth dashboard

The free Better Auth Starter dashboard is optional. Add `BETTER_AUTH_API_KEY` only to the intended Convex deployment to enable it; leaving it unset keeps the hosted dashboard disconnected. Connect the dashboard to the deployment's `https://<deployment>.convex.site` base URL and `/api/auth` path. Never put the key in `VITE_*` variables or a committed file. Remove this optional variable to disconnect it without changing authentication credentials or sessions.

The integration pins `@better-auth/infra` to 0.4.13 and `@better-auth/core` to the existing Better Auth version 1.6.30. `authDashboard.ts` removes API keys from the dashboard's public plugin configuration and scopes deferred database after-hooks to their captured endpoint context. The HTTP handler awaits outstanding audit work because Convex ends background work when an action returns. Audit export is best effort and uses the infrastructure client's timeout; an infrastructure outage must not prevent ordinary login or logout.

Activity tracking and managed directory sync are disabled, so no additional component schema is needed. Google, Resend, trusted frontend origins, user mapping and migration gates stay in the application. Hosted dashboard access gives Better Auth infrastructure access to authentication users, sessions and audit metadata, including administrative endpoints; it is not a read-only integration. Application profiles are separate from component auth profiles. Do not use dashboard user deletion or profile changes without checking their impact on application records. Start with browsing users, sessions and audit logs. No dashboard mutation tests should run against production.

Starter pricing was checked on 2026-09-30: $0/month, one seat, 10,000 audit logs/month with one-day retention, and 1,000 security detections/month. Do not enable paid plans, directory sync, replacement email delivery or security plugins as part of this integration. See [current pricing](https://better-auth.com/pricing) before changing scope.
