import mongoose from 'mongoose';
import Category from '../../src/models/category';
import Client from '../../src/models/client';
import Menu from '../../src/models/menu';

describe('Per-branch uniqueness hooks characterization', () => {
  const createId = () => new mongoose.Types.ObjectId();

  it('Menu rejects duplicate name for the same brancheId', async () => {
    const brancheId = createId();

    await Menu.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId,
      name: 'Coffee',
      price: 10,
      type: 'drink',
    });

    await expect(
      Menu.create({
        ownerId: createId(),
        createdBy: createId(),
        brancheId,
        name: 'Coffee',
        price: 12,
        type: 'drink',
      })
    ).rejects.toThrow('Menu must be unique for brancheId combination');
  });

  it('Category rejects duplicate category for the same brancheId', async () => {
    const brancheId = createId();

    await Category.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId,
      category: 'VIP Room',
      type: 'open',
      price: 50,
    });

    await expect(
      Category.create({
        ownerId: createId(),
        createdBy: createId(),
        brancheId,
        category: 'VIP Room',
        type: 'open',
        price: 60,
      })
    ).rejects.toThrow('Category must be unique for brancheId combination');
  });

  it('Client rejects duplicate phone for the same brancheId', async () => {
    const brancheId = createId();

    await Client.create({
      ownerId: createId(),
      createdBy: createId(),
      brancheId,
      name: 'Alice',
      phone: '0100000000',
    });

    await expect(
      Client.create({
        ownerId: createId(),
        createdBy: createId(),
        brancheId,
        name: 'Bob',
        phone: '0100000000',
      })
    ).rejects.toThrow('Client must be unique for brancheId combination');
  });
});
