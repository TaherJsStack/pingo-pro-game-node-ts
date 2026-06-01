import express, { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import Database from './src/DB/mongoDBConfig';
import routerAPI from './src/router/api';
import rootAPI from './src/router/api-admin';
import { config } from 'dotenv';
import { init } from './socket';

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './swagger';
import { auditMiddleware } from './src/middleware/audit.middleware';
import { errorHandler } from './src/middleware/errorHandler';

config();

class App {
  public app: Application;
  private port: string | number;
  private swaggerDocs = swaggerJsdoc(swaggerOptions);

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4001;
    this.initializeMiddlewares();
    this.initializeViews();
    this.initializeRoutes();
    this.initializeDatabase();
    // this.initializeSocket();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, AppLanguage, Allowencrypt, cartId, favoriteId, http://2.58.80.7:4001, 2.58.80.7:4001, 2.58.80.7"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
      );
      
      next();
    });

    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      // You can add your logic for setting the locale here
      next();
    });
  }

  private initializeViews(): void {
    this.app.set('view engine', 'ejs');
    this.app.set('views', 'views');
    this.app.use('/assets', express.static(path.join(__dirname, '../../assets')));
    this.app.use('**/public', express.static(path.join(__dirname, '../../public')));
    this.app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocs));

    // Serve static files (for accessing uploaded files)
    this.app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));


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

  private initializeDatabase(): void {
    Database.connect();
  }

  private initializeSocket(): void {
    const server = this.app.listen(this.port, () => {
      console.log(`Magic Happens On Port localhost:${this.port}`);
    });

    const io = init(server);
    io.on('connection', socket => {
      socket.emit('myId', socket.id);

      socket.on('socketId:orders', (msg) => {
        for (const element of msg.ordrsId) {
          // Order.updateOne({ _id: element }, { $set: { 'socketId': msg.socketId } }).then(res => {
          //     console.log('Order.update ---> ', res);
          // });
        }
      });
    });
  }

  public start(): void {
        this.app.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
        });

        // Graceful shutdown
        // process.on('SIGINT', async () => {
        //   await Database.close();
        //   process.exit(0);
        // });
        
    }
}

export default App;
