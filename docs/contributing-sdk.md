# Contributing to the SDK

This guide covers contributing to `@lineproof/sdk`.

## Setup

```bash
cd sdk
pnpm install
```

## Running Tests

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Building

```bash
pnpm build
```

Outputs CJS, ESM, and `.d.ts` declarations to `dist/`.

## Module Structure

| File | Purpose |
|------|---------|
| `src/types.ts` | All shared interfaces, enums, and error types |
| `src/client.ts` | `LineProofClient` — top-level entry point |
| `src/queue.ts` | `QueueClient` — queue lifecycle operations |
| `src/enrollment.ts` | `EnrollmentClient` — enroll and cancel |
| `src/escrow.ts` | `EscrowClient` — deposit, release, refund |
| `src/identity.ts` | `IdentityClient` — bind and transfer checks |
| `src/events.ts` | Typed event definitions for all contract namespaces |
| `src/utils.ts` | Address validation, stroops conversion, helpers |

## Design Principles

1. **Thin wrapper** — the SDK converts inputs into typed contract calls. It does not add off-chain business logic.
2. **Explicit errors** — all failures throw `SDKError` with a `code` string. Catch it by code, not by message.
3. **No hidden state** — the SDK does not cache contract state. Every query goes to the network.
4. **Type safety** — all contract inputs and outputs have TypeScript types. Avoid `any`.
5. **ESM-first** — use `.js` extensions in all imports for Node ESM compatibility.

## Adding a New Contract Method

1. Add the method signature to the appropriate client class.
2. Add corresponding types to `src/types.ts` if needed.
3. Add event types to `src/events.ts` if the method emits events.
4. Write a unit test in `tests/`.
5. Export from `src/index.ts` if it's a new top-level export.
6. Update `CHANGELOG.md` under `[Unreleased]`.

## Testing Against a Local Network

Set environment variables and point the client at your local Soroban RPC:

```typescript
const client = new LineProofClient({
  networkPassphrase: NetworkPassphrase.STANDALONE,
  rpcServerUrl: 'http://localhost:8080',
  privateKey: process.env.STELLAR_PRIVATE_KEY,
});
```
