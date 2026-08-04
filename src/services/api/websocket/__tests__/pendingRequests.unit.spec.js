import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPendingRequest,
  resolvePendingRequest,
  rejectPendingRequest,
  rejectAllPendingRequests,
  clearPendingRequests,
  getPendingRequestsCount,
} from '@/services/api/websocket/pendingRequests';
import {
  SocketTimeoutError,
  SocketDisconnectedError,
} from '@/services/api/websocket/errors';

describe('pendingRequests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearPendingRequests();
  });

  afterEach(() => {
    clearPendingRequests();
    vi.useRealTimers();
  });

  it('should resolve a pending request with the given payload', async () => {
    const promise = createPendingRequest('req-1');

    const resolved = resolvePendingRequest('req-1', { uuid: 'msg-1' });

    expect(resolved).toBe(true);
    await expect(promise).resolves.toEqual({ uuid: 'msg-1' });
    expect(getPendingRequestsCount()).toBe(0);
  });

  it('should reject a pending request with the given error', async () => {
    const promise = createPendingRequest('req-2');
    const error = new Error('create failed');

    const rejected = rejectPendingRequest('req-2', error);

    expect(rejected).toBe(true);
    await expect(promise).rejects.toBe(error);
    expect(getPendingRequestsCount()).toBe(0);
  });

  it('should timeout and reject with SocketTimeoutError', async () => {
    const promise = createPendingRequest('req-3', { timeoutMs: 15000 });

    vi.advanceTimersByTime(15000);

    await expect(promise).rejects.toBeInstanceOf(SocketTimeoutError);
    expect(getPendingRequestsCount()).toBe(0);
  });

  it('should warn and return false for unknown request ids on resolve', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolvePendingRequest('unknown', {})).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should warn and return false for unknown request ids on reject', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(rejectPendingRequest('unknown', new Error('x'))).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should reject all pending requests', async () => {
    const first = createPendingRequest('req-a');
    const second = createPendingRequest('req-b');
    const error = new SocketDisconnectedError();

    rejectAllPendingRequests(error);

    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    expect(getPendingRequestsCount()).toBe(0);
  });

  it('should ignore duplicate resolve after the request was already settled', async () => {
    const promise = createPendingRequest('req-dup');
    resolvePendingRequest('req-dup', { ok: true });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolvePendingRequest('req-dup', { ok: false })).toBe(false);
    warnSpy.mockRestore();

    await expect(promise).resolves.toEqual({ ok: true });
  });
});
