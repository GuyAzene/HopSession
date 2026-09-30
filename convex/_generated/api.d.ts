/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authEnvironment from "../authEnvironment.js";
import type * as authMigration from "../authMigration.js";
import type * as authUser from "../authUser.js";
import type * as debts from "../debts.js";
import type * as drinks from "../drinks.js";
import type * as events from "../events.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as legacyAuthTables from "../legacyAuthTables.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authEnvironment: typeof authEnvironment;
  authMigration: typeof authMigration;
  authUser: typeof authUser;
  debts: typeof debts;
  drinks: typeof drinks;
  events: typeof events;
  helpers: typeof helpers;
  http: typeof http;
  legacyAuthTables: typeof legacyAuthTables;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
