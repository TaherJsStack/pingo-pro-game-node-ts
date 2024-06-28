"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const mongoDBConfig_1 = __importDefault(require("./src/DB/mongoDBConfig"));
const api_1 = __importDefault(require("./src/router/api"));
const api_admin_1 = __importDefault(require("./src/router/api-admin"));
const socket_1 = require("./socket");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./swagger"));
(0, dotenv_1.config)();
class App {
    constructor() {
        this.swaggerDocs = (0, swagger_jsdoc_1.default)(swagger_1.default);
        this.app = (0, express_1.default)();
        this.port = process.env.PORT || 4001;
        this.initializeMiddlewares();
        this.initializeViews();
        this.initializeRoutes();
        this.initializeDatabase();
        // this.initializeSocket();
    }
    initializeMiddlewares() {
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.use((req, res, next) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, AppLanguage, Allowencrypt, cartId, favoriteId, http://2.58.80.7:4001, 2.58.80.7:4001, 2.58.80.7");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
            next();
        });
        this.app.use(async (req, res, next) => {
            // You can add your logic for setting the locale here
            next();
        });
    }
    initializeViews() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', 'views');
        this.app.use('/assets', express_1.default.static(path_1.default.join(__dirname, '../../assets')));
        this.app.use('**/public', express_1.default.static(path_1.default.join(__dirname, '../../public')));
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(this.swaggerDocs));
        // this.app.get('/', function (req, res) {
        //   res.send('Hello World!');
        // });
    }
    initializeRoutes() {
        this.app.use("/api/root/v1", api_admin_1.default);
        this.app.use("/api/v1", api_1.default);
        this.app.use("/", express_1.default.static(path_1.default.join(__dirname, "../../views/browser/")));
    }
    initializeDatabase() {
        mongoDBConfig_1.default.connect();
    }
    initializeSocket() {
        const server = this.app.listen(this.port, () => {
            console.log(`Magic Happens On Port localhost:${this.port}`);
        });
        const io = (0, socket_1.init)(server);
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
    start() {
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
exports.default = App;
