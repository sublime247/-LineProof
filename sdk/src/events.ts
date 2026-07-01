/**
 * Event type definitions for LineProof contract events.
 * These mirror the on-chain event topics emitted by each contract.
 */

export type EventNamespace =
  | 'lineproof.queue'
  | 'lineproof.enrollment'
  | 'lineproof.escrow'
  | 'lineproof.identity'
  | 'lineproof.factory';

export interface LineProofRawEvent {
  namespace: EventNamespace;
  kind: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  data: unknown;
}

// ── Queue events ──────────────────────────────────────────────────────────────
export interface QueueInitializedEvent extends LineProofRawEvent {
  namespace: 'lineproof.queue';
  kind: 'Initialized';
}

export interface EnrollmentOpenedEvent extends LineProofRawEvent {
  namespace: 'lineproof.queue';
  kind: 'EnrollmentOpened';
}

export interface EnrollmentClosedEvent extends LineProofRawEvent {
  namespace: 'lineproof.queue';
  kind: 'EnrollmentClosed';
}

export interface PositionAdvancedEvent extends LineProofRawEvent {
  namespace: 'lineproof.queue';
  kind: 'Advanced';
  positionId: number;
}

export interface QueueClosedEvent extends LineProofRawEvent {
  namespace: 'lineproof.queue';
  kind: 'QueueClosed';
}

// ── Enrollment events ─────────────────────────────────────────────────────────
export interface EnrolledEvent extends LineProofRawEvent {
  namespace: 'lineproof.enrollment';
  kind: 'Enrolled';
  identity: string;
  proofHash: string;
}

export interface EnrollmentCancelledEvent extends LineProofRawEvent {
  namespace: 'lineproof.enrollment';
  kind: 'Cancelled';
  identity: string;
}

export interface EnrollmentFinalizedEvent extends LineProofRawEvent {
  namespace: 'lineproof.enrollment';
  kind: 'Finalized';
  identity: string;
}

// ── Escrow events ─────────────────────────────────────────────────────────────
export interface EscrowDepositedEvent extends LineProofRawEvent {
  namespace: 'lineproof.escrow';
  kind: 'Deposited';
  identity: string;
  amount: bigint;
}

export interface EscrowReleasedEvent extends LineProofRawEvent {
  namespace: 'lineproof.escrow';
  kind: 'Released';
  identity: string;
  amount: bigint;
}

export interface EscrowRefundedEvent extends LineProofRawEvent {
  namespace: 'lineproof.escrow';
  kind: 'Refunded';
  identity: string;
  amount: bigint;
}

export interface EscrowExpiredEvent extends LineProofRawEvent {
  namespace: 'lineproof.escrow';
  kind: 'Expired';
  identity: string;
  amount: bigint;
}

// ── Identity events ───────────────────────────────────────────────────────────
export interface IdentityBoundEvent extends LineProofRawEvent {
  namespace: 'lineproof.identity';
  kind: 'Bound';
  identity: string;
}

export interface IdentityUnboundEvent extends LineProofRawEvent {
  namespace: 'lineproof.identity';
  kind: 'Unbound';
  identity: string;
}

export interface TransferRevertedEvent extends LineProofRawEvent {
  namespace: 'lineproof.identity';
  kind: 'TransferReverted';
  from: string;
  to: string;
}

// ── Factory events ────────────────────────────────────────────────────────────
export interface QueueDeployedEvent extends LineProofRawEvent {
  namespace: 'lineproof.factory';
  kind: 'Deployed';
  slug: string;
  contractId: string;
  version: number;
}

export interface QueueRegisteredEvent extends LineProofRawEvent {
  namespace: 'lineproof.factory';
  kind: 'Registered';
  slug: string;
}

export type AnyLineProofEvent =
  | QueueInitializedEvent | EnrollmentOpenedEvent | EnrollmentClosedEvent
  | PositionAdvancedEvent | QueueClosedEvent
  | EnrolledEvent | EnrollmentCancelledEvent | EnrollmentFinalizedEvent
  | EscrowDepositedEvent | EscrowReleasedEvent | EscrowRefundedEvent | EscrowExpiredEvent
  | IdentityBoundEvent | IdentityUnboundEvent | TransferRevertedEvent
  | QueueDeployedEvent | QueueRegisteredEvent;
