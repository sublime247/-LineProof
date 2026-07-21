import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import * as queueService from '../../services/queueService.js';

vi.mock('../../services/queueService.js');

describe('Queues Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/queues', () => {
    it('returns 200 with list of queues', async () => {
      vi.mocked(queueService.listQueues).mockReturnValue([{ id: 'q1' }] as any);
      const res = await request(app).get('/api/queues');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'q1' }]);
      expect(queueService.listQueues).toHaveBeenCalledWith(undefined);
    });

    it('passes status filter to service', async () => {
      vi.mocked(queueService.listQueues).mockReturnValue([]);
      const res = await request(app).get('/api/queues?status=Open');
      expect(res.status).toBe(200);
      expect(queueService.listQueues).toHaveBeenCalledWith('Open');
    });
  });

  describe('GET /api/queues/:id', () => {
    it('returns 404 if not found', async () => {
      vi.mocked(queueService.getQueue).mockResolvedValue(undefined);
      const res = await request(app).get('/api/queues/q1');
      expect(res.status).toBe(404);
    });

    it('returns 200 with queue if found', async () => {
      vi.mocked(queueService.getQueue).mockResolvedValue({ id: 'q1' } as any);
      const res = await request(app).get('/api/queues/q1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'q1' });
    });
  });

  describe('POST /api/queues', () => {
    it('returns 400 on invalid body', async () => {
      const res = await request(app).post('/api/queues').send({ name: 'q1' });
      expect(res.status).toBe(400);
      expect(res.body.error.issues).toBeDefined();
    });

    it('returns 201 on success', async () => {
      vi.mocked(queueService.createQueue).mockReturnValue({ id: 'q1' } as any);
      const res = await request(app).post('/api/queues').send({
        name: 'q1',
        description: 'desc',
        maxPositions: 10,
        advancementRule: 'Fifo'
      });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 'q1' });
    });
  });

  describe('POST /api/queues/:id/advance', () => {
    it('returns 404 if advance fails', async () => {
      vi.mocked(queueService.advanceQueue).mockReturnValue(false);
      const res = await request(app).post('/api/queues/q1/advance').send({ count: 1 });
      expect(res.status).toBe(404);
    });

    it('returns 200 on success', async () => {
      vi.mocked(queueService.advanceQueue).mockReturnValue(true);
      const res = await request(app).post('/api/queues/q1/advance').send({ count: 1 });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/queues/:id/close', () => {
    it('returns 404 if close fails', async () => {
      vi.mocked(queueService.closeQueue).mockReturnValue(false);
      const res = await request(app).post('/api/queues/q1/close').send();
      expect(res.status).toBe(404);
    });

    it('returns 200 on success', async () => {
      vi.mocked(queueService.closeQueue).mockReturnValue(true);
      const res = await request(app).post('/api/queues/q1/close').send();
      expect(res.status).toBe(200);
    });
  });
});
