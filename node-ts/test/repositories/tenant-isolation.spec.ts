import mongoose from 'mongoose';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Session from '../../src/models/session';
import Tenant from '../../src/models/tenant';
import { BaseRepository } from '../../src/repositories/BaseRepository';

describe('tenant repository isolation', () => {
  const sessionRepository = new BaseRepository<any>(Session);

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

    const session = await Session.create({
      createdBy: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      clientId: null,
      shiftId: null,
      activeState: true,
      description: '',
      total: 0,
      devicesTotal: 0,
      menuItemsTotal: 0,
      devices: [],
      menuItems: [],
    } as any);

    return { owner, tenant, branche, session };
  }

  it('prevents tenant A from reading, updating, or deleting tenant B documents', async () => {
    const tenantA = await seedTenant('a');
    const tenantB = await seedTenant('b');

    const scopeA = { tenantId: String(tenantA.tenant._id), requireTenant: true };

    await expect(sessionRepository.findById(String(tenantB.session._id), scopeA)).resolves.toBeNull();
    await expect(sessionRepository.updateById(String(tenantB.session._id), { description: 'blocked' } as any, scopeA)).resolves.toBeNull();
    await expect(sessionRepository.deleteById(String(tenantB.session._id), scopeA)).resolves.toBeNull();

    const tenantACount = await sessionRepository.countDocuments({}, scopeA);
    expect(tenantACount).toBe(1);
  });
});
