import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../middleware/requestLogger.js';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/queues',
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    ...overrides,
  } as unknown as Request;
}

function makeRes(statusCode = 200) {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    statusCode,
    on: (event: string, cb: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    emit: (event: string) => {
      (listeners[event] ?? []).forEach((cb) => cb());
    },
  } as unknown as Response & { emit: (e: string) => void };
}

describe('requestLogger', () => {
  // Use a plain function spy so TypeScript doesn't narrow the type too tightly
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('calls next()', () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requestLogger(makeReq(), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('logs INFO for 2xx responses on finish', () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes(200);
    requestLogger(makeReq(), res, next);
    res.emit('finish');
    expect(logSpy).toHaveBeenCalledOnce();
    const raw = (logSpy.mock.calls[0] as string[])[0];
    const logged = JSON.parse(raw) as { level: string; status: number; method: string };
    expect(logged.level).toBe('INFO');
    expect(logged.status).toBe(200);
    expect(logged.method).toBe('GET');
  });

  it('logs WARN for 4xx responses', () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes(404);
    requestLogger(makeReq(), res, next);
    res.emit('finish');
    const raw = (logSpy.mock.calls[0] as string[])[0];
    const logged = JSON.parse(raw) as { level: string };
    expect(logged.level).toBe('WARN');
  });

  it('logs ERROR for 5xx responses', () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes(500);
    requestLogger(makeReq(), res, next);
    res.emit('finish');
    const raw = (logSpy.mock.calls[0] as string[])[0];
    const logged = JSON.parse(raw) as { level: string };
    expect(logged.level).toBe('ERROR');
  });
});
