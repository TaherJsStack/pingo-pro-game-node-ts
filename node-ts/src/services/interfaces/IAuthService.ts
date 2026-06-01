export interface IAuthService {
  register(payload: any): Promise<{ token: string; user: any }>;
}
