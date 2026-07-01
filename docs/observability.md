# Observability

LineProof's reference backend emits structured JSON logs and exposes a health endpoint. This document describes the current observability surface and recommendations for production.

## Health Endpoint

```
GET /health
```

Returns:

```json
{
  "status": "ok",
  "timestamp": "2025-07-01T10:00:00.000Z",
  "environment": "production"
}
```

Use this endpoint for load-balancer health checks and uptime monitors.

## Structured Logging

Every request is logged as a single JSON line:

```json
{
  "level": "INFO",
  "method": "POST",
  "path": "/api/enrollments/enroll",
  "status": 201,
  "ms": 12,
  "ip": "10.0.0.1",
  "userAgent": "Mozilla/5.0",
  "ts": "2025-07-01T10:00:00.000Z"
}
```

Log levels: `INFO` (2xx/3xx), `WARN` (4xx), `ERROR` (5xx).

## Rate Limit Headers

All responses include:

- `X-RateLimit-Limit` — requests allowed per window
- `X-RateLimit-Remaining` — requests remaining
- `X-RateLimit-Reset` — Unix timestamp of window reset
- `Retry-After` — seconds to wait (only on 429 responses)

## Recommended Production Setup

| Concern | Recommendation |
|---------|---------------|
| Log aggregation | Ship JSON logs to Datadog, Loki, or CloudWatch |
| Metrics | Add `prom-client` and expose `/metrics` for Prometheus |
| Tracing | Add OpenTelemetry SDK with OTLP exporter |
| Alerting | Alert on 5xx rate > 1%, p99 latency > 500ms, rate limit rate > 5% |
| Uptime | Monitor `/health` from an external probe every 30 seconds |

## Contract Event Indexing

On-chain events are the canonical source of truth. To monitor contract activity:

1. Subscribe to Soroban RPC `getEvents` for each contract address.
2. Filter by topic prefixes: `lineproof.queue`, `lineproof.enrollment`, `lineproof.escrow`, `lineproof.identity`, `lineproof.factory`.
3. Persist events to a queryable store (PostgreSQL, ClickHouse, or similar).
4. Expose paginated event history via the backend API.

See [docs/event-model.md](event-model.md) for the full event schema.
