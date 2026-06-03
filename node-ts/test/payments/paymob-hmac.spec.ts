import crypto from 'crypto';
import { verifyPaymobHmac } from '../../src/adapters/payments/PaymobProvider';

const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function nestedValue(payload: any, path: string): string {
  const value = path.split('.').reduce((current, key) => current?.[key], payload);
  return value === null || typeof value === 'undefined' ? '' : String(value);
}

function sign(payload: any, secret: string): string {
  const base = HMAC_FIELDS.map((field) => nestedValue(payload.obj, field)).join('');
  return crypto.createHmac('sha512', secret).update(base).digest('hex');
}

describe('verifyPaymobHmac', () => {
  const payload = {
    obj: {
      amount_cents: 12500,
      created_at: '2026-06-03T10:00:00Z',
      currency: 'EGP',
      error_occured: false,
      has_parent_transaction: false,
      id: 99,
      integration_id: 123,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 456 },
      owner: 1,
      pending: false,
      source_data: { pan: '2346', sub_type: 'Mastercard', type: 'card' },
      success: true,
    },
  };

  it('accepts a valid HMAC', () => {
    expect(verifyPaymobHmac(payload, sign(payload, 'secret'), 'secret')).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const hmac = sign(payload, 'secret');
    expect(verifyPaymobHmac({ obj: { ...payload.obj, amount_cents: 12600 } }, hmac, 'secret')).toBe(false);
  });
});
