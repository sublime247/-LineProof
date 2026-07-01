/**
 * Utility helpers for the LineProof SDK.
 */

import { Keypair } from '@stellar/stellar-sdk';
import { SDKError } from './types.js';

/** Validates that a string looks like a valid Stellar public key. */
export function assertValidAddress(address: string, fieldName = 'address'): void {
  if (typeof address !== 'string' || !/^G[A-Z2-7]{55}$/.test(address)) {
    throw new SDKError(
      'INVALID_ADDRESS',
      `${fieldName} must be a 56-character Stellar public key starting with G`,
      { value: address },
    );
  }
}

/** Converts a readable asset amount to stroops (7 decimal places). */
export function toStroops(amount: number): bigint {
  if (amount < 0) throw new SDKError('INVALID_AMOUNT', 'Amount must be non-negative');
  return BigInt(Math.round(amount * 10_000_000));
}

/** Converts stroops back to a human-readable decimal string. */
export function fromStroops(stroops: bigint): string {
  const whole = stroops / 10_000_000n;
  const frac = stroops % 10_000_000n;
  const fracStr = frac.toString().padStart(7, '0').replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
}

/** Returns the current Unix timestamp in seconds. */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Returns a Unix timestamp N days from now. */
export function daysFromNow(days: number): number {
  return nowSeconds() + days * 86400;
}

/** Truncates a long Stellar address for display: GABCD…WXYZ */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/** Generates a random Stellar keypair (for testing only — never for production keys). */
export function generateTestKeypair(): { publicKey: string; secretKey: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secretKey: kp.secret() };
}
