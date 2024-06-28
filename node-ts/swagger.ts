import { SwaggerOptions } from "swagger-ui-express";

const swaggerOptions: SwaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'Your API Description',
    },
    servers: [
      {
        url: 'http://localhost:4001/api/v1',
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
