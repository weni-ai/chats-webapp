import { describe, it, expect, vi, beforeEach } from 'vitest';
import setupWSListeners from '@/services/api/websocket/listeners';
import roomListener from '@/services/api/websocket/listeners/room';

vi.mock('@/services/api/websocket/listeners/room', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    message: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/services/api/websocket/listeners/discussion', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    message: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/services/api/websocket/listeners/status', () => ({
  default: {
    update: vi.fn(),
  },
}));

describe('setupWSListeners', () => {
  let wsMock;
  let appMock;

  beforeEach(() => {
    wsMock = {
      on: vi.fn(),
    };
    appMock = {};
  });

  it('should register all room listeners', () => {
    setupWSListeners({ ws: wsMock, app: appMock });

    expect(wsMock.on).toHaveBeenCalledWith(
      'rooms.create',
      expect.any(Function),
    );
    expect(wsMock.on).toHaveBeenCalledWith(
      'rooms.update',
      expect.any(Function),
    );
    expect(wsMock.on).toHaveBeenCalledWith('rooms.close', expect.any(Function));
    expect(wsMock.on).toHaveBeenCalledWith('msg.create', expect.any(Function));
    expect(wsMock.on).toHaveBeenCalledWith('msg.update', expect.any(Function));
  });

  it('should register all discussion listeners', () => {
    setupWSListeners({ ws: wsMock, app: appMock });

    expect(wsMock.on).toHaveBeenCalledWith(
      'discussion_msg.create',
      expect.any(Function),
    );
    expect(wsMock.on).toHaveBeenCalledWith(
      'discussions.create',
      expect.any(Function),
    );
    expect(wsMock.on).toHaveBeenCalledWith(
      'discussions.update',
      expect.any(Function),
    );
    expect(wsMock.on).toHaveBeenCalledWith(
      'discussions.close',
      expect.any(Function),
    );
  });

  it('should register the status update listener', () => {
    setupWSListeners({ ws: wsMock, app: appMock });

    expect(wsMock.on).toHaveBeenCalledWith(
      'status.update',
      expect.any(Function),
    );
  });

  it('should call the correct listener with the payload and context when invoked', () => {
    setupWSListeners({ ws: wsMock, app: appMock });

    const payload = { data: 'test' };
    const callback = wsMock.on.mock.calls[0][1];

    callback(payload);

    expect(roomListener.create).toHaveBeenCalledWith(payload, { app: appMock });
  });
});
