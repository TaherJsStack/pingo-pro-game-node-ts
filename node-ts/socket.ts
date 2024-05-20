import { Server } from 'http';
import socketIo from 'socket.io';

let io: socketIo.Server;

export const init = (server: Server): socketIo.Server => {
    io = new socketIo.Server(server);
    return io;
};

export const getIo = (): socketIo.Server => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
