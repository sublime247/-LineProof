#!/usr/bin/env bash
# fund_testnet_accounts.sh
# Funds one or more Stellar testnet accounts via Friendbot.
# Usage: ./scripts/fund_testnet_accounts.sh GADDR1 [GADDR2 ...]

set -euo pipefail

FRIENDBOT="https://friendbot.stellar.org"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <stellar-address> [<stellar-address> ...]"
  exit 1
fi

for addr in "$@"; do
  echo "Funding $addr …"
  response=$(curl -s -w "\n%{http_code}" "${FRIENDBOT}?addr=${addr}")
  body=$(echo "$response" | head -n -1)
  code=$(echo "$response" | tail -n 1)

  if [[ "$code" == "200" ]]; then
    echo "  ✓ Funded: $addr"
  else
    echo "  ✗ Failed (HTTP $code): $body" >&2
  fi
done
