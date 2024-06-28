"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express from 'express';
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./api/auth"));
const employees_1 = __importDefault(require("./api/employees"));
const branche_1 = __importDefault(require("./api/branche"));
const categories_1 = __importDefault(require("./api/categories"));
const client_1 = __importDefault(require("./api/client"));
const sessions_1 = __importDefault(require("./api/sessions"));
const invoice_1 = __importDefault(require("./api/invoice"));
const menu_1 = __importDefault(require("./api/menu"));
const pricing_1 = __importDefault(require("./api/pricing"));
const invoice_menu_1 = __importDefault(require("./api/invoice-menu"));
const statistics_1 = __importDefault(require("./api/statistics"));
const address_1 = __importDefault(require("./api/address"));
const inbox_1 = __importDefault(require("./api/inbox"));
const complaints_suggestion_1 = __importDefault(require("./api/complaints-suggestion"));
const subscription_1 = __importDefault(require("./api/subscription"));
const plan_1 = __importDefault(require("./api/plan"));
// Import middleware if needed
// import signReqData from '../middleware/sign-req-data';
const routerAPI = (0, express_1.default)();
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
routerAPI.use("/auth", auth_1.default);
routerAPI.use("/employees", employees_1.default);
routerAPI.use("/branches", branche_1.default);
routerAPI.use("/categories", categories_1.default);
routerAPI.use("/clients", client_1.default);
routerAPI.use("/sessions", sessions_1.default);
routerAPI.use("/invoice", invoice_1.default);
routerAPI.use("/menu", menu_1.default);
routerAPI.use("/pricing", pricing_1.default);
routerAPI.use("/invoice-menu", invoice_menu_1.default);
routerAPI.use("/statistics", statistics_1.default);
routerAPI.use("/address", address_1.default);
routerAPI.use("/inbox", inbox_1.default);
routerAPI.use("/complaints-suggestion", complaints_suggestion_1.default);
routerAPI.use("/subscription", subscription_1.default);
routerAPI.use("/plan", plan_1.default);
// Export the router
exports.default = routerAPI;
