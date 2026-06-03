import { SwaggerOptions } from "swagger-ui-express";
import { env } from './src/config/env';

const swaggerOptions: SwaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Pingo Pro Game API',
      version: '1.0.0',
      description: 'Your API Description',
    },
    servers: [
      {
        url: env.swaggerServerUrl,
      },
    ],
    components: {
      securitySchemes: {
        authorization: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
    schemes: ["http", "https"],
  },
  apis: ['./src/router/*.ts'], // Path to the API docs
};

export default swaggerOptions;
