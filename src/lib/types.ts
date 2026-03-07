import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';

// Single source of truth for the current user type — import from here instead of redefining
export type CurrentUser = FunctionReturnType<typeof api.users.current>;
