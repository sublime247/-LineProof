# Upgrade Guide

This document describes how to upgrade LineProof contracts safely.

## Principles

1. Contract upgrades are irreversible once applied. Test thoroughly on testnet before mainnet.
2. Only the factory admin can authorize queue upgrades.
3. The new WASM must be deployed and its hash registered before the upgrade call.
4. Existing storage layout must remain compatible — adding fields is safe; removing or reordering is not.

## Upgrade a Queue Contract

### 1. Build the new WASM

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### 2. Upload the new WASM to the network

```bash
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/lineproof_queue.wasm \
  --source deployer \
  --network testnet
# Outputs: <new_wasm_hash>
```

### 3. Update factory version range (if needed)

```bash
soroban contract invoke \
  --id $FACTORY_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- set_config \
  --admin $(soroban keys address admin) \
  --min_version 1 \
  --max_version 2
```

### 4. Call upgrade_queue on the factory

```bash
soroban contract invoke \
  --id $FACTORY_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- upgrade_queue \
  --admin $(soroban keys address admin) \
  --slug my-queue \
  --new_version 2 \
  --new_wasm_hash <new_wasm_hash>
```

### 5. Verify the upgrade

```bash
./scripts/check_contract_storage.sh $QUEUE_CONTRACT_ID '"config"'
# Check version field matches new version
```

## Storage Compatibility Rules

| Change | Safe? |
|--------|-------|
| Add new field to a struct | ✓ Yes — Soroban uses XDR and ignores unknown fields |
| Remove a field | ✗ No — deserialization will fail for existing records |
| Reorder fields | ✗ No — XDR is order-sensitive |
| Change field type | ✗ No — type mismatch panics |
| Add a new function | ✓ Yes |
| Remove a function | ✗ No — callers will fail |

## Rollback

Contract WASM upgrades cannot be rolled back on-chain. Mitigation:

- Maintain the previous WASM hash so you can redeploy a parallel contract if needed
- Use a feature flag pattern where new logic is gated behind a storage flag
- Always upgrade on testnet first and run the full integration test suite
