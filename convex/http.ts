import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';
import { getAuthTrustedOrigins } from './authEnvironment';

const http = httpRouter();
authComponent.registerRoutesLazy(http, createAuth, {
    cors: true,
    trustedOrigins: getAuthTrustedOrigins,
});

export default http;
