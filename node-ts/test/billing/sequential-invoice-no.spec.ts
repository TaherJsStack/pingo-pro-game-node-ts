import mongoose from 'mongoose';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Invoice from '../../src/models/invoice';
import Tenant from '../../src/models/tenant';
import InvoiceService from '../../src/services/invoice.service';

describe('billing sequential invoice numbers', () => {
  const createId = () => new mongoose.Types.ObjectId();

  async function seedScope() {
    const owner = await Auth.create({
      username: 'owner',
      firstName: 'Owner',
      lastName: 'Tester',
      email: `owner-${Date.now()}-${Math.random()}@example.com`,
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
      name: 'Tenant One',
      slug: `tenant-one-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: `Branch-${Date.now()}-${Math.random()}`,
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    return { owner, tenant, branche };
  }

  it('allocates invoiceNo atomically and sequentially for concurrent finalizes', async () => {
    const { owner, tenant, branche } = await seedScope();
    const basePayload = {
      brancheId: branche._id,
      categories: [
        {
          categoryId: createId(),
          type: 'room',
          Sessiontype: 'open',
          price: 0,
          startTime: new Date('2025-01-01T10:00:00.000Z'),
          endTime: new Date('2025-01-01T11:00:00.000Z'),
          estimationInHours: 1,
          estimationInMinutes: 0,
        },
      ],
      menuItems: [],
    } as any;

    const [first, second] = await Promise.all([
      InvoiceService.createNewInvoice(basePayload, String(owner._id), String(tenant._id)),
      InvoiceService.createNewInvoice(basePayload, String(owner._id), String(tenant._id)),
    ]);

    expect(first.invoiceNo).not.toBe(second.invoiceNo);
    expect([first.invoiceNo, second.invoiceNo].sort((a, b) => a - b)).toEqual([1, 2]);

    const invoices = await Invoice.find({ tenantId: tenant._id, brancheId: branche._id }).sort({ invoiceNo: 1 });
    expect(invoices).toHaveLength(2);
    expect(invoices.map((invoice) => invoice.invoiceNo)).toEqual([1, 2]);
  });
});
