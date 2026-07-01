# Example: Event Ticketing

This example demonstrates LineProof applied to a high-demand event ticket queue — for example, a concert or a limited product drop.

## Use Case

An event organiser needs to allocate tickets fairly, preventing bots from claiming all spots and scalpers from reselling queue positions. Requirements:

- Non-transferable queue positions
- Escrow deposit to deter no-shows
- FIFO advancement to reward early registrants

## Queue Configuration

```typescript
import { LineProofClient, AdvancementRule, NetworkPassphrase } from '@lineproof/sdk';

const client = new LineProofClient({
  networkPassphrase: NetworkPassphrase.TESTNET,
  rpcServerUrl: 'https://soroban-testnet.stellar.org',
  privateKey: process.env.STELLAR_PRIVATE_KEY,
});

const factory = await client.deployFactory();

const queueAddress = await factory.createQueue({
  slug: 'concert-main-stage-2025',
  name: 'Main Stage Concert 2025',
  maxPositions: 500,
  enrollmentOpenAt: Math.floor(Date.now() / 1000),
  enrollmentCloseAt: Math.floor(Date.now() / 1000) + 3 * 86400,
  advancementRule: AdvancementRule.FIRST_IN_FIRST_OUT,
  escrowRequired: true,
  escrowAsset: 'USDC',
  escrowAmountReadable: 25, // 25 USDC deposit
});
```

## Escrow Flow

1. Fan enrolls and deposits 25 USDC escrow
2. Queue advances — fan's position moves to `Advanced`
3. Fan completes purchase → escrow `Released` to organiser
4. Fan doesn't complete purchase → escrow `Refunded` after hold period

## Anti-Scalping Guarantee

Transfer attempts are rejected at the identity contract level. Any attempt to move a position to a different Stellar account is:

1. Detected by `can_transfer()` returning `false`
2. Recorded as a `TransferAttempt` on-chain
3. Emitted as a `TransferReverted` event

This provides an immutable audit trail of scalping attempts.

## Key Properties

| Property | Value |
|----------|-------|
| Advancement rule | FIFO |
| Escrow | Required — 25 USDC |
| Transferable | No — protocol-enforced |
| Anti-scalping | Yes — transfer attempts recorded on-chain |
| Duplicate enrollment | Rejected |
