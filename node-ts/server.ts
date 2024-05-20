
import App from './app';

const app = new App();
app.start();


// import express, { Request, Response, NextFunction } from 'express';
// import bodyParser from 'body-parser';
// import path from 'path';
// import cors from 'cors';
// import { connectDB } from './src/DB/mongoDBConfig';
// import routerAPI from './src/router/api';
// import { init } from './socket';
// import { config } from 'dotenv';

// config();

// const PORT = process.env.PORT || 4001;

// // Setting the max listeners for events
// import { EventEmitter } from 'events';
// // EventEmitter.prototype._maxListeners = 10;

// const app = express();

// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// // Set the view engine to ejs
// app.set('view engine', 'ejs');
// app.set('views', 'views');

// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept, Authorization, AppLanguage, Allowencrypt, cartId, favoriteId"
//     );
//     res.setHeader(
//         "Access-Control-Allow-Methods",
//         "GET, POST, PATCH, PUT, DELETE, OPTIONS"
//     );
//     next();
// });

// app.use(async (req: Request, res: Response, next: NextFunction) => {
//     // You can add your logic for setting the locale here
//     next();
// });

// app.use('/assets', express.static(path.join(__dirname, 'assets')));
// app.use('**/public', express.static(path.join(__dirname, 'public')));

// connectDB();

// app.use("/api/v1", routerAPI);
// app.use("/", express.static(path.join(__dirname, "/views/browser/")));

// const server = app.listen(PORT, () => console.log(`Magic Happens On Port localhost:${PORT}`));

// const io = init(server);

// io.on('connection', socket => {
//     socket.emit('myId', socket.id);

//     socket.on('socketId:orders', (msg) => {
//         for (const element of msg.ordrsId) {
//             // Order.updateOne({ _id: element }, { $set: { 'socketId': msg.socketId } }).then(res => {
//             //     console.log('Order.update ---> ', res);
//             // });
//         }
//     });
// });

// export default app;

