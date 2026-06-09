import { DeviceType } from '../../enums/device-type.enum';
import { FoodType } from '../../enums/food-type.enum';

/**
 * Ownership/scoping context shared by every seeded document. All ids come from
 * the owner record created during registration.
 */
export interface SeedContext {
  ownerId: any;
  tenantId: any;
  brancheId: any;
  createdBy: any;
}

/**
 * Default devices seeded for a new owner: one device per DeviceType, twice —
 * once `single`, once `multi` (10 devices total). Names are distinct to satisfy
 * the unique-per-branch constraint on Device.name.
 */
export function buildDefaultDevices(ctx: SeedContext): Array<Record<string, any>> {
  return Object.values(DeviceType).flatMap((type) => [
    { ...ctx, name: `${type} (Single)`, type, mode: 'single', price: getRandomPrice(5, 25) },
    {
      ...ctx,
      name: `${type} (Multi)`,
      type,
      mode: 'multi',
      price: getRandomPrice(5, 25),
      priceMulti: getRandomPrice(25, 65),
    },
  ]);
}

function getRandomPrice(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
/**
 * Default menu seeded for a new owner: 2 drinks (hot/cold) and 2 foods
 * (hot/cold). Prices are placeholder defaults the owner can edit.
 */
export function buildDefaultMenu(ctx: SeedContext): Array<Record<string, any>> {
  return [
    { ...ctx, name: 'Hot Tea', type: FoodType.HOT_DRINK, price: 10 },
    { ...ctx, name: 'Iced Cola', type: FoodType.COLD_DRINK, price: 12 },
    { ...ctx, name: 'Burger', type: FoodType.HOT_FOOD, price: 35 },
    { ...ctx, name: 'Garden Salad', type: FoodType.COLD_FOOD, price: 25 },
    { ...ctx, name: 'SNACKS', type: FoodType.SNACKS, price: 20 },
  ];
}
