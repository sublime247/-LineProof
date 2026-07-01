/**
 * LineProof TypeScript SDK
 *
 * Provides a high-level, typed API for interacting with LineProof Soroban contracts.
 * Handles contract calls, event subscription, retries, and identity management.
 *
 * @module @lineproof/sdk
 */

export * from './types.js';
export { LineProofClient } from './client.js';
export { QueueClient } from './queue.js';
export { EnrollmentClient } from './enrollment.js';
export { EscrowClient } from './escrow.js';
export { IdentityClient } from './identity.js';
export * from './utils.js';

// Re-export commonly used Stellar SDK types for convenience
export { Networks, Keypair } from '@stellar/stellar-sdk';
