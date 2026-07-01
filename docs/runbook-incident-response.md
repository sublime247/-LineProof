# Runbook: Incident Response

This runbook covers common operational incidents for LineProof operators.

---

## 1. Queue Stalled — Advancement Not Progressing

**Symptoms:** Enrolled positions remain Pending; `advance()` has not been called.

**Steps:**

1. Confirm queue status via contract storage:
   ```bash
   ./scripts/check_contract_storage.sh $QUEUE_CONTRACT_ID '"config"'
   ```
2. Verify status is `EnrollmentClosed`. If still `EnrollmentOpen`, close enrollment first:
   ```bash
   soroban contract invoke --id $QUEUE_CONTRACT_ID --source admin \
     --network testnet -- close_enrollment
   ```
3. Call advance in batches:
   ```bash
   soroban contract invoke --id $QUEUE_CONTRACT_ID --source admin \
     --network testnet -- advance --batch_size 50
   ```
4. Repeat until all positions are Advanced or the queue is closed.

---

## 2. Escrow Release Failing

**Symptoms:** `release()` panics with `escrow not active`.

**Steps:**

1. Fetch the escrow record:
   ```bash
   soroban contract invoke --id $ESCROW_CONTRACT_ID --source admin \
     --network testnet -- get_record --identity $IDENTITY --queue_id $QUEUE_ID
   ```
2. Check the `status` field. If already `Released` or `Refunded`, no action needed — the transaction may have already succeeded.
3. If `Expired`, the hold period elapsed. Coordinate with participants on next steps.

---

## 3. Duplicate Enrollment Attempt Blocked

**Symptoms:** User receives a conflict response from the enrollment API.

**Steps:**

1. Query the enrollment contract to confirm the existing record:
   ```bash
   soroban contract invoke --id $ENROLLMENT_CONTRACT_ID \
     --network testnet -- enrollment_record \
     --identity $IDENTITY --queue_id $QUEUE_ID
   ```
2. If the record exists and is legitimate, advise the participant their enrollment is confirmed.
3. If it appears to be a data error, escalate to a contract maintainer — enrollment records cannot be administratively removed without a cancel operation signed by the participant.

---

## 4. Identity Binding Revoked Unexpectedly

**Symptoms:** `bind()` panics with `identity revoked`.

**Steps:**

1. Fetch the identity record:
   ```bash
   soroban contract invoke --id $IDENTITY_CONTRACT_ID \
     --network testnet -- get_record --identity $IDENTITY
   ```
2. Check the `status` field. `Revoked` status is set by admin only.
3. If revocation was in error, contact the contract admin to issue a new identity in a fresh record.

---

## 5. Contract Admin Key Compromised

**Impact:** Critical — attacker could release/refund escrow, advance positions arbitrarily, or revoke identities.

**Immediate steps:**

1. Do NOT attempt to perform admin operations with the compromised key.
2. If the contract supports admin rotation (planned but not yet implemented), rotate immediately.
3. Freeze new enrollments by communicating out-of-band to participants.
4. Engage the LineProof security team at **security@lineproof.dev**.
5. Preserve all logs and on-chain event history for forensic analysis.

---

## Contact

- Security issues: **security@lineproof.dev**
- GitHub Discussions: https://github.com/lineproof/lineproof/discussions
