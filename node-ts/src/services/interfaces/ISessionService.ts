import { ISession } from '../../models/interfaces/session.interface';

export interface ISessionService {
  createItem(body: ISession, authUserId: string): Promise<any>;
  endSession(sessionId: string, body: any, authUserId: string): Promise<{ session: any; bill: any; message: string }>;
}
