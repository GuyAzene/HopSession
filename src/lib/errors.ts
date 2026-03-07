import { ConvexError } from 'convex/values';

interface ConvexErrorWithMessage {
    message?: unknown;
}

export function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ConvexError) {
        if (typeof error.data === 'string' && error.data.trim()) {
            return error.data;
        }

        if (
            error.data &&
            typeof error.data === 'object' &&
            typeof (error.data as ConvexErrorWithMessage).message === 'string'
        ) {
            const message = (error.data as ConvexErrorWithMessage).message as string;
            if (message.trim()) {
                return message;
            }
        }
    }

    return fallback;
}
