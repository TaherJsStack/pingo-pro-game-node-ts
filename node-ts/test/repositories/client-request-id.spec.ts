import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Session from '../../src/models/session';
import Tenant from '../../src/models/tenant';
import { SessionRepository } from '../../src/repositories/SessionRepository';

describe('client request id upsert', () => {
  const sessionRepository = new SessionRepository(Session);

  async function seedTenant(label: string) {
    const owner = await Auth.create({
      username: `${label}-owner`,
      firstName: 'Owner',
      lastName: 'Tester',
      email: `${label}-${Date.now()}-${Math.random()}@example.com`,
      phone: '01000000000',
      image: '',
      activeState: true,
      role: 2,
      permission: [2],
      authType: 'owner',
      permissions: [],
    } as any);

    const tenant = await Tenant.create({
      ownerId: owner._id,
      name: `${label} Tenant`,
      slug: `${label}-tenant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: `${label} Branch`,
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    return { owner, tenant, branche };
  }

  it('returns the same session for the same clientRequestId', async () => {
    const { owner, tenant, branche } = await seedTenant('client-request-id');
    const scope = { tenantId: String(tenant._id), requireTenant: true };
    const clientRequestId = `client-request-${Date.now()}-${Math.random()}`;

    const first = await sessionRepository.upsertByClientRequestId(
      {
        createdBy: owner._id,
        tenantId: tenant._id,
        clientRequestId,
        brancheId: branche._id,
        clientId: null,
        shiftId: null,
        activeState: true,
        description: 'first session',
        total: 0,
        devicesTotal: 0,
        menuItemsTotal: 0,
        devices: [],
        menuItems: [],
      } as any,
      scope
    );

    const second = await sessionRepository.upsertByClientRequestId(
      {
        createdBy: owner._id,
        tenantId: tenant._id,
        clientRequestId,
        brancheId: branche._id,
        clientId: null,
        shiftId: null,
        activeState: true,
        description: 'updated session',
        total: 0,
        devicesTotal: 0,
        menuItemsTotal: 0,
        devices: [],
        menuItems: [],
      } as any,
      scope
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(String(first.item._id)).toBe(String(second.item._id));
    expect(await sessionRepository.countDocuments({ clientRequestId }, scope)).toBe(1);
  });
});
