import { createServer, Server as HttpServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import socketIo, { Socket } from 'socket.io';
import { env } from './src/config/env';

export interface SocketAuthPayload extends JwtPayload {
  _id?: string;
  userId?: string;
  tenantId?: string;
  brancheId?: string;
  role?: number;
  permission?: number[];
  permissions?: unknown[];
}

export interface SocketData {
  auth?: SocketAuthPayload;
  tenantId?: string;
  brancheId?: string;
}

export const TENANT_ROOM_PREFIX = 'tenant:';
export const BRANCH_ROOM_PREFIX = 'branch:';

let io: socketIo.Server | null = null;

function parseBearerToken(rawToken?: string): string | null {
  if (!rawToken) {
    return null;
  }

  const trimmed = rawToken.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

export function getTenantRoom(tenantId: string): string {
  return `${TENANT_ROOM_PREFIX}${tenantId}`;
}

export function getBranchRoom(tenantId: string, brancheId: string): string {
  return `${BRANCH_ROOM_PREFIX}${tenantId}:${brancheId}`;
}

export function verifySocketToken(token?: string): SocketAuthPayload {
  const parsedToken = parseBearerToken(token);
  if (!parsedToken) {
    throw new Error('Missing socket token');
  }

  const decoded = jwt.verify(parsedToken, env.secret) as SocketAuthPayload;
  const tenantId = decoded.tenantId ? String(decoded.tenantId) : '';
  const userId = decoded._id ? String(decoded._id) : decoded.userId ? String(decoded.userId) : '';

  if (!tenantId || !userId) {
    throw new Error('Socket token is missing tenant or user context');
  }

  return {
    ...decoded,
    _id: userId,
    tenantId,
    brancheId: decoded.brancheId ? String(decoded.brancheId) : undefined,
  };
}

export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  try {
    const authToken = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization;
    const auth = verifySocketToken(Array.isArray(authToken) ? authToken[0] : authToken);
    (socket.data as SocketData).auth = auth;
    (socket.data as SocketData).tenantId = auth.tenantId;
    (socket.data as SocketData).brancheId = auth.brancheId;
    next();
  } catch (error) {
    next(new Error('Unauthorized socket connection'));
  }
}

export function registerSocketHandlers(server: socketIo.Server): socketIo.Server {
  server.use(authenticateSocket);
  server.on('connection', (socket: Socket) => {
    const auth = (socket.data as SocketData).auth;
    if (!auth?.tenantId) {
      socket.disconnect(true);
      return;
    }

    void socket.join(getTenantRoom(auth.tenantId));
    if (auth.brancheId) {
      void socket.join(getBranchRoom(auth.tenantId, auth.brancheId));
    }
  });

  return server;
}

export const initializeSocket = (server: HttpServer): socketIo.Server => {
  io = registerSocketHandlers(new socketIo.Server(server, {
    cors: {
      origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  }));

  return io;
};

export const getIo = (): socketIo.Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const closeSocket = async (): Promise<void> => {
  if (!io) {
    return;
  }

  const current = io;
  io = null;
  await new Promise<void>((resolve) => {
    current.close(() => resolve());
  });
};
