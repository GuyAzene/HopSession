import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { CurrentUser } from './types';

// Centralises the user query so components don't subscribe independently
export function useCurrentUser(): CurrentUser | undefined {
    return useQuery(api.users.current);
}
