import { describe, it, expect, beforeEach, vi } from 'vitest';

import { copilotSocketManager } from '../copilotSocketManager';

const { init, destroy, setContext } = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  setContext: vi.fn(),
}));

vi.mock('@weni/webchat-service', () => {
  const MockService = vi.fn().mockImplementation((config) => ({
    config,
    init,
    destroy,
    setContext,
  }));

  return { default: MockService };
});

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

  it('creates and initializes a service per channel uuid', () => {
    const service = copilotSocketManager.getOrCreateService(
      'channel-1',
      connection,
    );

    expect(service).toBeDefined();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('reuses the same service instance for the same channel uuid', () => {
    const first = copilotSocketManager.getOrCreateService(
      'channel-1',
      connection,
    );
    const second = copilotSocketManager.getOrCreateService('channel-1', {
      ...connection,
      host: 'https://other.weni.ai',
    });

    expect(second).toBe(first);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('creates a different instance for another channel uuid', () => {
    const first = copilotSocketManager.getOrCreateService(
      'channel-1',
      connection,
    );
    const second = copilotSocketManager.getOrCreateService('channel-2', {
      ...connection,
      channelUuid: 'channel-2',
    });

    expect(second).not.toBe(first);
    expect(init).toHaveBeenCalledTimes(2);
  });

  it('sets the room context on an existing service', () => {
    copilotSocketManager.getOrCreateService('channel-1', connection);
    copilotSocketManager.setRoomContext('channel-1', 'room-uuid');

    expect(setContext).toHaveBeenCalledWith('room-uuid');
  });

  it('destroys and removes a service', () => {
    const first = copilotSocketManager.getOrCreateService(
      'channel-1',
      connection,
    );

    copilotSocketManager.disposeService('channel-1');

    expect(destroy).toHaveBeenCalledTimes(1);

    const second = copilotSocketManager.getOrCreateService(
      'channel-1',
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
      'channel-1',
      connection,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalled();

    const recreated = copilotSocketManager.getOrCreateService(
      'channel-1',
      connection,
    );

    expect(recreated).not.toBe(failed);
    expect(init).toHaveBeenCalledTimes(2);

    consoleError.mockRestore();
  });
});
