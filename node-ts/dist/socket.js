"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.init = void 0;
const socket_io_1 = __importDefault(require("socket.io"));
let io;
const init = (server) => {
    io = new socket_io_1.default.Server(server);
    return io;
};
exports.init = init;
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
exports.getIo = getIo;
