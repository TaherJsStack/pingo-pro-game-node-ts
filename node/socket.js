
let io;

module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer, {
      cors: {
        origins: ['http://localhost:4200', 'https://oraiaandeve.com', "http://localhost:4000", "*" ],
        allowedHeaders: ['*'],
        
      }
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};