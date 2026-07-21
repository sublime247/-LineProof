import { Router, type IRouter, Request, Response } from 'express';
import { z } from 'zod';
import { listQueues, getQueueById, createQueue, advanceQueue, closeQueue, getQueueStats, openEnrollment, closeEnrollment } from '../services/queueService.js';
import { readQueueOnChain } from '../contracts/index.js';
import { SlugSchema } from '../schemas/slug.js';
import { NotFoundError, ValidationError } from '../errors/index.js';

const router: IRouter = Router();

const CreateQueueSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  maxPositions: z.number().int().positive(),
  advancementRule: z.enum(['FIFO', 'Priority', 'VerifiableRandomness']).optional(),
  escrowRequired: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

const AdvanceSchema = z.object({
  batchSize: z.number().int().positive().max(1000).optional(),
});

router.get('/', (req, res: Response): Response => {
  const { status } = req.query;
  const queues = listQueues();
  if (status && typeof status === 'string') {
    const filtered = queues.filter((q) => q.status === status);
    return res.json(filtered);
  }
  return res.json(queues);
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response, next): Promise<void> => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) {
      throw new ValidationError('Invalid queue ID format');
    }

    const onChain = await readQueueOnChain(slugResult.data);
    if (onChain) {
      res.json({ ...onChain, source: 'on-chain' });
      return;
    }

    const queue = getQueueById(slugResult.data);
    if (!queue) {
      throw new NotFoundError('Queue not found');
    }
    res.json({ ...queue, source: 'in-memory' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', (req: Request<{ id: string }>, res: Response, next): void => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) throw new ValidationError('Invalid queue ID format');

    const stats = getQueueStats(slugResult.data);
    if (!stats) throw new NotFoundError('Queue not found');
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res: Response, next): void => {
  try {
    const parsed = CreateQueueSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid request', { issues: parsed.error.issues });
    const queue = createQueue(parsed.data);
    res.status(201).json(queue);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/advance', (req: Request<{ id: string }>, res: Response, next): void => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) throw new ValidationError('Invalid queue ID format');

    const parsed = AdvanceSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid request', { issues: parsed.error.issues });

    const queue = advanceQueue(slugResult.data, parsed.data.batchSize ?? 10);
    if (!queue) throw new NotFoundError('Queue not found');
    res.json(queue);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close', (req: Request<{ id: string }>, res: Response, next): void => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) throw new ValidationError('Invalid queue ID format');

    const queue = closeQueue(slugResult.data);
    if (!queue) throw new NotFoundError('Queue not found');
    res.json(queue);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/open-enrollment', (req: Request<{ id: string }>, res: Response, next): void => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) throw new ValidationError('Invalid queue ID format');

    const queue = openEnrollment(slugResult.data);
    if (!queue) throw new NotFoundError('Queue not found');
    res.json(queue);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close-enrollment', (req: Request<{ id: string }>, res: Response, next): void => {
  try {
    const slugResult = SlugSchema.safeParse(req.params.id);
    if (!slugResult.success) throw new ValidationError('Invalid queue ID format');

    const queue = closeEnrollment(slugResult.data);
    if (!queue) throw new NotFoundError('Queue not found');
    res.json(queue);
  } catch (err) {
    next(err);
  }
});

export default router;
