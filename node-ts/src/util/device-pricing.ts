import DeviceModel from '../models/device';
import { BaseRepository } from '../repositories/BaseRepository';

const deviceRepository = new BaseRepository<any>(DeviceModel);

/**
 * Server-side device rate resolver — single source of truth for device pricing.
 * Used by both session creation and direct-invoice paths to ensure price cannot be forged by the client.
 * Returns the device's price (single mode) or priceMulti (multi mode) from the database.
 */
export async function resolveDeviceRate(
  deviceId: string | unknown,
  scope: any,
  mode: 'single' | 'multi'
): Promise<number> {
  if (!deviceId) return 0;

  const device = await deviceRepository.findById(String(deviceId), scope);
  return Number(mode === 'multi' ? device?.priceMulti ?? 0 : device?.price ?? 0);
}
