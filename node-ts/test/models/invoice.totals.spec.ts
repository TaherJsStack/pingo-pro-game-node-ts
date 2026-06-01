import mongoose from 'mongoose';
import Invoice from '../../src/models/invoice';
import InvoiceService from '../../src/services/invoice.service';

describe('Invoice model totals characterization', () => {
  const createId = () => new mongoose.Types.ObjectId();

  it('calculateCategoriesTotal computes duration * price and persists categoriesTotal', async () => {
    const invoice = await Invoice.create({
      createdBy: createId(),
      brancheId: createId(),
      categories: [
        {
          categoryId: createId(),
          type: 'open',
          Sessiontype: 'open',
          price: 40,
          startTime: new Date('2025-01-01T10:00:00.000Z'),
          endTime: new Date('2025-01-01T12:30:00.000Z'),
        },
      ],
      menuItems: [],
    });

    const total = InvoiceService.calculateCategoriesTotal(invoice.categories as any);
    expect(total).toBeCloseTo(100);

    await InvoiceService.syncInvoiceTotals(invoice as any);

    const persisted = await Invoice.findById(invoice._id).orFail();
    expect(persisted.categoriesTotal).toBeCloseTo(100);
  });

  it('calculateMenuItemsTotal computes quantity * price and persists menuItemsTotal', async () => {
    const invoice = await Invoice.create({
      createdBy: createId(),
      brancheId: createId(),
      categories: [],
      menuItems: [
        { itemID: createId(), itemName: 'Tea', quantity: 2, price: 30 },
        { itemID: createId(), itemName: 'Water', quantity: 3, price: 5 },
      ],
    });

    const total = InvoiceService.calculateMenuItemsTotal(invoice.menuItems as any);
    expect(total).toBe(75);

    await InvoiceService.syncInvoiceTotals(invoice as any);

    const persisted = await Invoice.findById(invoice._id).orFail();
    expect(persisted.menuItemsTotal).toBe(75);
  });

  it('service sync sets total = menuItemsTotal + categoriesTotal', async () => {
    const invoice = await Invoice.create({
      createdBy: createId(),
      brancheId: createId(),
      categories: [
        {
          categoryId: createId(),
          type: 'open',
          Sessiontype: 'open',
          price: 50,
          startTime: new Date('2025-01-01T10:00:00.000Z'),
          endTime: new Date('2025-01-01T12:00:00.000Z'),
        },
      ],
      menuItems: [{ itemID: createId(), itemName: 'Tea', quantity: 1, price: 30 }],
    });

    await InvoiceService.syncInvoiceTotals(invoice as any);

    const persisted = await Invoice.findById(invoice._id).orFail();
    expect(persisted.categoriesTotal).toBe(100);
    expect(persisted.menuItemsTotal).toBe(30);
    expect(persisted.total).toBe(130);
  });
});
