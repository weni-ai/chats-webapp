import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRequestWithRetry } from '../requests';

describe('makeRequestWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return the result when the request succeeds on the first attempt', async () => {
    const mockResult = { data: 'success' };
    const mockRequestFunction = vi.fn().mockResolvedValue(mockResult);

    const result = await makeRequestWithRetry(mockRequestFunction);

    expect(result).toEqual(mockResult);
    expect(mockRequestFunction).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed on the second attempt', async () => {
    const mockResult = { data: 'success' };
    const mockRequestFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(mockResult);

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const resultPromise = makeRequestWithRetry(mockRequestFunction);

    await vi.advanceTimersByTimeAsync(1000);

    const result = await resultPromise;

    expect(result).toEqual(mockResult);
    expect(mockRequestFunction).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 1/3), retrying in 1000ms...',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should retry and succeed on the third attempt with exponential backoff', async () => {
    const mockResult = { data: 'success' };
    const mockRequestFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockRejectedValueOnce(new Error('Second attempt failed'))
      .mockResolvedValueOnce(mockResult);

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const resultPromise = makeRequestWithRetry(mockRequestFunction);

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await resultPromise;

    expect(result).toEqual(mockResult);
    expect(mockRequestFunction).toHaveBeenCalledTimes(3);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 1/3), retrying in 1000ms...',
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 2/3), retrying in 2000ms...',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should throw error after max retries are exhausted', async () => {
    const mockError = new Error('Request failed');
    const mockRequestFunction = vi.fn().mockRejectedValue(mockError);

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const testPromise = expect(
      makeRequestWithRetry(mockRequestFunction),
    ).rejects.toThrow('Request failed');

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await testPromise;

    expect(mockRequestFunction).toHaveBeenCalledTimes(3);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

    consoleWarnSpy.mockRestore();
  });

  it('should use custom maxRetries parameter', async () => {
    const mockError = new Error('Request failed');
    const mockRequestFunction = vi.fn().mockRejectedValue(mockError);
    const maxRetries = 2;

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const testPromise = expect(
      makeRequestWithRetry(mockRequestFunction, maxRetries),
    ).rejects.toThrow('Request failed');

    await vi.advanceTimersByTimeAsync(1000);

    await testPromise;

    expect(mockRequestFunction).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 1/2), retrying in 1000ms...',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should use custom baseDelay parameter', async () => {
    const mockResult = { data: 'success' };
    const mockRequestFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(mockResult);

    const baseDelay = 500;
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const resultPromise = makeRequestWithRetry(
      mockRequestFunction,
      3,
      baseDelay,
    );

    await vi.advanceTimersByTimeAsync(500);

    const result = await resultPromise;

    expect(result).toEqual(mockResult);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 1/3), retrying in 500ms...',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should calculate exponential backoff delays correctly', async () => {
    const mockError = new Error('Request failed');
    const mockRequestFunction = vi.fn().mockRejectedValue(mockError);
    const baseDelay = 100;

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const testPromise = expect(
      makeRequestWithRetry(mockRequestFunction, 3, baseDelay),
    ).rejects.toThrow('Request failed');

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    await testPromise;

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 1/3), retrying in 100ms...',
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Request failed (attempt 2/3), retrying in 200ms...',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle function that throws non-Error objects', async () => {
    const mockRequestFunction = vi.fn().mockRejectedValue('String error');

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const testPromise = expect(
      makeRequestWithRetry(mockRequestFunction),
    ).rejects.toBe('String error');

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await testPromise;

    expect(mockRequestFunction).toHaveBeenCalledTimes(3);

    consoleWarnSpy.mockRestore();
  });
});
