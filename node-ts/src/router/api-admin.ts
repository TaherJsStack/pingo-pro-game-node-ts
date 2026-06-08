import express from 'express';

import statisticsRouterAPI           from './api-admin/statistics';
import authsRouterAPI                from './api-admin/auths';
import complaintsSuggestionRouterAPI from './api-admin/complaints-suggestion';
import brancheRouterAPI from './api-admin/branche';
import categoriesRouterAPI from './api-admin/categories';
import clientRouterAPI from './api-admin/client';
import inboxRouterAPI from './api-admin/inbox';
import auditRouterAPI from './api-admin/audit';
import billingRouterAPI from './api-admin/billing';
import paymentAdminRouterAPI from './api-admin/payment-admin';

import signReqData from '../middleware/sign-req-data';
import rootAuthGuard from '../middleware/root-auth.guard';

const routerAPI = express();

// Every /api/root/v1 route is root/admin-only. Enforce authentication + root authorization
// once here so legacy read routers (auths, clients, audit, ...) can never leak cross-tenant
// data to unauthenticated or non-root callers. Individual routers may re-apply the same guard
// (idempotent and harmless).
routerAPI.use(signReqData, rootAuthGuard);

// Define routes
routerAPI.use("/statistics",            statisticsRouterAPI);
routerAPI.use("/auths",                 authsRouterAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionRouterAPI);
routerAPI.use("/branches",              brancheRouterAPI);
routerAPI.use("/categories",            categoriesRouterAPI);
routerAPI.use("/clients",               clientRouterAPI);
routerAPI.use("/inbox",                 inboxRouterAPI);
routerAPI.use("/audit",                 auditRouterAPI);
routerAPI.use("/billing",               billingRouterAPI);
// Root-only payment operations (subscriptions / payments / payment-methods / webhook-events).
routerAPI.use(paymentAdminRouterAPI);

// Export the router
export default routerAPI;
