// import express from 'express';
import express, { Request, Response, NextFunction, Application } from 'express';

import authRouterAPI            from './api/auth';
import employeesAPI             from './api/employees';
import brancheAPI               from './api/branche';
import categoriesAPI            from './api/categories';
import clientsAPI               from './api/client';
import sessionsAPI              from './api/sessions';
import invoiceAPI               from './api/invoice';
import menuAPI                  from './api/menu';
import pricingAPI               from './api/pricing';
import invoiceMenugAPI          from './api/invoice-menu';
import statisticsgAPI           from './api/statistics';
import addressAPI               from './api/address';
import inboxAPI                 from './api/inbox';
import complaintsSuggestionAPI  from './api/complaints-suggestion';
import subscriptionAPI          from './api/subscription';
import planAPI                  from './api/plan';

// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';

const routerAPI = express();

// Use middleware if needed
// routerAPI.use(signReqData);
/**
 * @swagger
 * tags:
 *  name: auth
 *  description: everything about auth
 */

/**
 * @swagger
 * definitions:
 *
 *  AuthLoginModel:
 *   type: object
 *   required:
 *    - email
 *    - password
 *   properties:
 *     name:
 *       type: string
 *       description: default name admin
 *     email:
 *       type: string
 *     password:
 *       type: string
 *
 *  AuthResponseModel:
 *   type: object
 *   properties:
 *     auth:
 *      type: object
 *      properties:
 *          _id:
 *            type: string
 *          name:
 *            type: string
 *          email:
 *            type: string
 *          role:
 *            type: string
 *          createdAt:
 *            type: string
 *          password:
 *            type: string
 *     token:
 *       type: string
 *     message:
 *       type: string
 *
 *  SuccessModel:
 *   type: object
 *   properties:
 *     message:
 *       type: string
 *
 *
 *  ErrorModel:
 *   type: object
 *   properties:
 *     message:
 *       type: string
 *
 */

/**
 * @swagger
 * /auth/getToken:
 *  post:
 *    tags: [auth]
 *    summary:  get token.
 *    description: login and get token to use it on other options, add your token to Available authorizations and enjoy
 *    parameters:
 *
 *      - in: header
 *        description: you can switch between tow languages 'ar' for Arabic and 'en' for English, note that changes in message content
 *        name: AppLanguage
 *        required: true
 *        default: "ar"
 *
 *      - in: body
 *        name: auth
 *        description: fill form to get your new TOKEN
 *        schema:
 *          type: object
 *          required:
 *            - email:
 *            - password:
 *
 *          properties:
 *            name:
 *              type: string
 *              #default: "t.taher.mean@gmail.com"
 *            email:
 *              type: string
 *              required: true
 *            password:
 *              type: string
 *              required: true
 *
 *    responses:
 *      '200':
 *        description: create successful response
 *        schema:
 *          items:
 *             $ref: '#/definitions/AuthResponseModel'
 *      '500':
 *        description: create error response
 *        schema:
 *          items:
 *             $ref: '#/definitions/ErrorModel'
 *
 */
// Define routes
routerAPI.use("/auth",                  authRouterAPI);
routerAPI.use("/employees",             employeesAPI);
routerAPI.use("/branches",              brancheAPI);
routerAPI.use("/categories",            categoriesAPI);
routerAPI.use("/clients",               clientsAPI);
routerAPI.use("/sessions",              sessionsAPI);
routerAPI.use("/invoice",               invoiceAPI);
routerAPI.use("/menu",                  menuAPI);
routerAPI.use("/pricing",               pricingAPI);
routerAPI.use("/invoice-menu",          invoiceMenugAPI);
routerAPI.use("/statistics",            statisticsgAPI);
routerAPI.use("/address",               addressAPI);
routerAPI.use("/inbox",                 inboxAPI);
routerAPI.use("/complaints-suggestion", complaintsSuggestionAPI);
routerAPI.use("/subscription",          subscriptionAPI);
routerAPI.use("/plan",                  planAPI);



// Export the router
export default routerAPI;
