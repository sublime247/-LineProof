/**
 * Public read-only routes — no auth required.
 * These endpoints are safe to expose without rate limiting.
 */
import { Router, type IRouter } from 'express';
import { listQueues, getQueueStats } from '../services/queueService.js';
import { healthPayload } from '../health.js';
import { NotFoundError } from '../errors/index.js';

const router: IRouter = Router();

/** GET /public/queues — list all queues (summary, no internal fields) */
router.get('/queues', (req, res) => {
  const summary = listQueues().map(({ id, name, slug, status, enrolled, maxPositions, advancementRule }) => ({
    id,
    name,
    slug,
    status,
    enrolled,
    maxPositions,
    advancementRule,
  }));
  res.json(summary);
});

/** GET /public/queues/:id/stats — public queue statistics */
router.get('/queues/:id/stats', (req, res, next) => {
  try {
    const stats = getQueueStats(req.params.id);
    if (!stats) throw new NotFoundError('Queue not found');
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /public/health — liveness check.
 * Unified with GET /health so monitoring tools see one consistent shape
 * regardless of which path they probe (issue #31 / #33). The legacy `ts` field
 * is retained alongside the canonical `timestamp` for backward compatibility.
 */
router.get('/health', (req, res) => {
  const payload = healthPayload();
  res.json({ ...payload, ts: payload.timestamp });
});

export default router;
