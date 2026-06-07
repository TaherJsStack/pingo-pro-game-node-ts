import { registerSocketHandlers, getBranchRoom, getTenantRoom } from '../../socket';
import { RealtimeEvent } from '../../src/enums';

describe('tenant socket rooms', () => {
  it('generates tenant-safe room names', () => {
    expect(getTenantRoom('tenant-a')).toBe('tenant:tenant-a');
    expect(getBranchRoom('tenant-a', 'branch-1')).toBe('branch:tenant-a:branch-1');
  });

  it('joins authenticated sockets to tenant and branch rooms', () => {
    const join = jest.fn();
    const disconnect = jest.fn();
    const server = {
      use: jest.fn(),
      on: jest.fn().mockImplementation((event: string, handler: any) => {
        if (event === 'connection') {
          handler({
            data: {
              auth: {
                tenantId: 'tenant-a',
                brancheId: 'branch-1',
              },
            },
            join,
            disconnect,
          });
        }
        return server;
      }),
    } as any;

    registerSocketHandlers(server);

    expect(server.use).toHaveBeenCalled();
    expect(join).toHaveBeenCalledWith('tenant:tenant-a');
    expect(join).toHaveBeenCalledWith('branch:tenant-a:branch-1');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('exports event names used by the realtime service', () => {
    expect(RealtimeEvent.SessionOpened).toBe('session.opened');
    expect(RealtimeEvent.InvoiceUpdated).toBe('invoice.updated');
  });
});
