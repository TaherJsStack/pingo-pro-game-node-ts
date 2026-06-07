import jwt from 'jsonwebtoken';
import { authenticateSocket, verifySocketToken } from '../../socket';
import { env } from '../../src/config/env';

describe('socket auth', () => {
  it('accepts a valid tenant-scoped token', () => {
    const token = jwt.sign(
      {
        _id: 'user-1',
        tenantId: 'tenant-1',
        brancheId: 'branch-1',
      },
      env.secret
    );

    const decoded = verifySocketToken(token);
    expect(decoded.tenantId).toBe('tenant-1');
    expect(decoded._id).toBe('user-1');
    expect(decoded.brancheId).toBe('branch-1');
  });

  it('rejects a missing token at handshake time', () => {
    const socket = {
      handshake: { auth: {}, headers: {} },
      data: {},
    } as any;
    const next = jest.fn();

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects a token without tenant context', () => {
    const token = jwt.sign({ _id: 'user-1' }, env.secret);

    expect(() => verifySocketToken(token)).toThrowError('Socket token is missing tenant or user context');
  });
});
