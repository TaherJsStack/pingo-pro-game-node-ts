"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const mongoDBConfig_1 = require("./src/DB/mongoDBConfig");
const api_1 = __importDefault(require("./src/router/api"));
const socket_1 = require("./socket");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const PORT = process.env.PORT || 4001;
// EventEmitter.prototype._maxListeners = 10;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, AppLanguage, Allowencrypt, cartId, favoriteId");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    next();
});
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // You can add your logic for setting the locale here
    next();
}));
app.use('/assets', express_1.default.static(path_1.default.join(__dirname, 'assets')));
app.use('**/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
(0, mongoDBConfig_1.connectDB)();
app.use("/api/v1", api_1.default);
app.use("/", express_1.default.static(path_1.default.join(__dirname, "/views/browser/")));
const server = app.listen(PORT, () => console.log(`Magic Happens On Port localhost:${PORT}`));
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
exports.default = app;
