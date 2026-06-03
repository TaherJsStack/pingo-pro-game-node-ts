import express, { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import type { Server } from 'http';
import Database from './src/DB/mongoDBConfig';
import routerAPI from './src/router/api';
import rootAPI from './src/router/api-admin';
import webhookAPI from './src/router/api/webhook';
import { config } from 'dotenv';

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './swagger';
import { auditMiddleware } from './src/middleware/audit.middleware';
import { errorHandler } from './src/middleware/errorHandler';
import { env } from './src/config/env';
import { startBillingScheduler, stopBillingScheduler } from './src/jobs/billing-scheduler';
import { ensureUploadDirectory, getUploadPath } from './src/util/uploads';

config();

class App {
  public app: Application;
  private server?: Server;
  private port: number;
  private swaggerDocs = swaggerJsdoc(swaggerOptions);

  constructor() {
    this.app = express();
    this.port = env.port;
    this.app.set('trust proxy', 1);
    this.initializeMiddlewares();
    this.initializeHealthRoutes();
    this.initializeViews();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    const corsOptions: CorsOptions = {
      origin: (origin, callback) => {
        if (env.corsOrigins.includes('*') || !origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'AppLanguage',
        'Allowencrypt',
        'cartId',
        'favoriteId',
        'Idempotency-Key',
      ],
    };

    this.app.use(cors(corsOptions));

    this.app.use("/api/v1/webhooks", webhookAPI);
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      // You can add your logic for setting the locale here
      next();
    });
  }

  private initializeHealthRoutes(): void {
    this.app.get('/healthz', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        service: 'pingo-pro-game-api',
        uptime: process.uptime(),
      });
    });

    this.app.get('/readyz', (_req: Request, res: Response) => {
      const mongoConnected = Database.isConnected();
      const ready = mongoConnected;

      res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not_ready',
        checks: {
          config: 'loaded',
          mongo: mongoConnected ? 'connected' : 'disconnected',
          payments: env.paymentsEnabled ? 'enabled' : 'disabled',
          billingCron: env.billingCronEnabled ? 'enabled' : 'disabled',
        },
      });
    });
  }

  private initializeViews(): void {
    this.app.set('view engine', 'ejs');
    this.app.set('views', 'views');
    this.app.use('/assets', express.static(path.join(__dirname, '../../assets')));
    this.app.use('**/public', express.static(path.join(__dirname, '../../public')));
    if (env.swaggerEnabled) {
      this.app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocs));
    }

    // Serve static files (for accessing uploaded files)
    this.app.use('/api/uploads', express.static(getUploadPath()));


    // this.app.get('/', function (req, res) {
    //   res.send('Hello World!');
    // });
  }

  private initializeRoutes(): void {
    this.app.use(auditMiddleware);
    this.app.use("/api/root/v1", rootAPI);
    this.app.use("/api/v1", routerAPI);
    this.app.use("/", express.static(path.join(__dirname, "../../views/browser/")));
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    ensureUploadDirectory();
    await Database.connect();
    startBillingScheduler();

    await new Promise<void>((resolve, reject) => {
      const server = this.app.listen(this.port, () => {
        server.off('error', reject);
        console.log(`Server running on port ${this.port}`);
        resolve();
      });
      server.once('error', reject);
      this.server = server;
    });
  }

  public async stop(): Promise<void> {
    stopBillingScheduler();

    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      this.server = undefined;
    }

    await Database.close();
  }
}

export default App;
