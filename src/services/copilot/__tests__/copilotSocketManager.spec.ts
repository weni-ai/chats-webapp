import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { copilotSocketManager } from '../copilotSocketManager';

const { init, destroy, setContext, MockService } = vi.hoisted(() => {
  const init = vi.fn().mockResolvedValue(undefined);
  const destroy = vi.fn();
  const setContext = vi.fn();
  const MockService = vi.fn().mockImplementation((config) => ({
    config,
    init,
    destroy,
    setContext,
  }));

  return { init, destroy, setContext, MockService };
});

vi.mock('@weni/webchat-service', () => ({
  default: MockService,
}));

const connection = {
  socketUrl: 'wss://websocket.weni.ai',
  channelUuid: 'channel-1',
  host: 'https://flows.weni.ai',
  connectOn: 'mount',
  storage: 'local',
  callbackUrl: '',
};

describe('copilotSocketManager', () => {
  beforeEach(() => {
    copilotSocketManager.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a service keyed by room and channel with a room sessionId', () => {
    const service = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    expect(service).toBeDefined();
    expect(init).toHaveBeenCalledTimes(1);
    expect(MockService).toHaveBeenCalledWith(
      expect.objectContaining({
        channelUuid: 'channel-1',
        sessionId: 'room-1',
      }),
    );
  });

  it('reuses the same service instance for the same room and channel', () => {
    const first = copilotSocketManager.getOrCreateService('room-1', connection);
    const second = copilotSocketManager.getOrCreateService('room-1', {
      ...connection,
      host: 'https://other.weni.ai',
    });

    expect(second).toBe(first);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('creates a different instance per room even on the same channel', () => {
    const first = copilotSocketManager.getOrCreateService('room-1', connection);
    const second = copilotSocketManager.getOrCreateService(
      'room-2',
      connection,
    );

    expect(second).not.toBe(first);
    expect(init).toHaveBeenCalledTimes(2);
    expect(MockService).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sessionId: 'room-1' }),
    );
    expect(MockService).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sessionId: 'room-2' }),
    );
  });

  it('sets the room context on an existing service', () => {
    copilotSocketManager.getOrCreateService('room-1', connection);
    copilotSocketManager.setRoomContext('room-1', connection, 'room-1');

    expect(setContext).toHaveBeenCalledWith('room-1');
  });

  it('destroys and removes a service', () => {
    const first = copilotSocketManager.getOrCreateService('room-1', connection);

    copilotSocketManager.disposeService('room-1', connection);

    expect(destroy).toHaveBeenCalledTimes(1);

    const second = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    expect(second).not.toBe(first);
    expect(init).toHaveBeenCalledTimes(2);
  });

  it('removes the service from the map when init fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    init.mockRejectedValueOnce(new Error('init failed'));

    const failed = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalled();

    const recreated = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    expect(recreated).not.toBe(failed);
    expect(init).toHaveBeenCalledTimes(2);

    consoleError.mockRestore();
  });

  it('disposes an idle service after the eviction timeout', () => {
    vi.useFakeTimers();

    copilotSocketManager.getOrCreateService('room-1', connection);
    copilotSocketManager.scheduleEviction('room-1', connection, 120000);

    vi.advanceTimersByTime(119999);
    expect(destroy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(destroy).toHaveBeenCalledTimes(1);

    const recreated = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    expect(recreated).toBeDefined();
    expect(init).toHaveBeenCalledTimes(2);
  });

  it('clears pending eviction timers on reset', () => {
    vi.useFakeTimers();

    copilotSocketManager.getOrCreateService('room-1', connection);
    copilotSocketManager.scheduleEviction('room-1', connection, 120000);
    copilotSocketManager.reset();

    expect(destroy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(120000);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('cancels eviction when the room becomes active again', () => {
    vi.useFakeTimers();

    const first = copilotSocketManager.getOrCreateService('room-1', connection);
    copilotSocketManager.scheduleEviction('room-1', connection, 120000);

    const resumed = copilotSocketManager.getOrCreateService(
      'room-1',
      connection,
    );

    expect(resumed).toBe(first);

    vi.advanceTimersByTime(120000);
    expect(destroy).not.toHaveBeenCalled();
  });
});
