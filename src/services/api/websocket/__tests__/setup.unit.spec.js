import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebSocketSetup from '@/services/api/websocket/setup';
import WS from '@/services/api/websocket/socket';
import listeners from '@/services/api/websocket/listeners';
import { useDashboard } from '@/store/modules/dashboard';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

vi.mock('@/services/api/websocket/socket', () => {
  return {
    __esModule: true,
    default: vi.fn(() => ({
      ws: {
        readyState: 1,
        OPEN: 1,
        close: vi.fn(),
        send: vi.fn(),
        onclose: null,
      },
      send: vi.fn(),
      on: vi.fn(),
    })),
  };
});

vi.mock('@/services/api/websocket/listeners');
vi.mock('@/utils/env', () => ({
  default: vi.fn(() => 'ws://mock-url'),
}));

vi.mock('@/store/modules/dashboard');
vi.mock('@/store/modules/chats/rooms');
vi.mock('@/store/modules/chats/discussions');

describe('WebSocketSetup', () => {
  let webSocketSetup;
  const mockApp = {
    appToken: 'mockToken',
    appProject: 'mockProject',
    updateUserStatus: vi.fn(),
  };
  let dashboardStore;
  let roomsStore;
  let discussionsStore;
  beforeEach(() => {
    dashboardStore = {
      viewedAgent: null,
    };
    roomsStore = {
      getAll: vi.fn(),
      orderBy: {
        ongoing: 'ongoing',
        waiting: 'waiting',
        flow_start: 'flow_start',
      },
    };
    discussionsStore = {
      getAll: vi.fn(),
    };
    useDashboard.mockReturnValue(dashboardStore);
    useRooms.mockReturnValue(roomsStore);
    useDiscussions.mockReturnValue(discussionsStore);
    webSocketSetup = new WebSocketSetup({ app: mockApp });
    webSocketSetup.ws = {
      send: vi.fn(),
      ws: {
        readyState: 1,
        OPEN: 1,
        close: vi.fn(),
        send: vi.fn(),
        onclose: vi.fn(),
      },
    };
  });

  describe('buildUrl', () => {
    it('should return the agentWSUrl if viewedAgent has an email', () => {
      dashboardStore.viewedAgent = { email: 'agent@example.com' };

      const url = webSocketSetup.buildUrl();
      expect(url).toBe(
        'ws://mock-url/manager/rooms?Token=mockToken&project=mockProject&user_email=agent@example.com',
      );
    });

    it('should return the managerWSUrl if viewedAgent is null', () => {
      const url = webSocketSetup.buildUrl();
      expect(url).toBe(
        'ws://mock-url/agent/rooms?Token=mockToken&project=mockProject',
      );
    });
  });

  describe('connect', () => {
    it('should initialize WS with the correct URL and call listeners', async () => {
      const spySetupPingInterval = vi.spyOn(
        webSocketSetup,
        'setupPingInterval',
      );
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');

      const mockWS = {
        ws: {
          readyState: 1,
          OPEN: 1,
          CLOSED: 3,
          close: vi.fn(),
          send: vi.fn(),
          onclose: null,
          onopen: null,
          onerror: null,
        },
        send: vi.fn(),
        on: vi.fn(),
      };

      WS.mockReturnValue(mockWS);

      const connectPromise = webSocketSetup.connect();

      if (mockWS.ws.onopen) {
        mockWS.ws.onopen();
      }

      const result = await connectPromise;

      expect(result).toBe(true);
      expect(WS).toHaveBeenCalledWith('mockUrl');
      expect(listeners).toHaveBeenCalledWith({
        ws: webSocketSetup.ws,
        app: mockApp,
      });
      expect(spySetupPingInterval).toHaveBeenCalled();
      expect(webSocketSetup.isFirstReconnectAttempt).toBe(true);
      expect(webSocketSetup.reconnectAttempts).toBe(0);
    });

    it('should return false on connection timeout', async () => {
      vi.useFakeTimers();
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');

      const connectPromise = webSocketSetup.connect();

      vi.advanceTimersByTime(10000);

      const result = await connectPromise;

      expect(result).toBe(false);
      vi.useRealTimers();
    });

    it('should return false on connection error', async () => {
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');

      const mockWS = {
        ws: {
          readyState: 1,
          OPEN: 1,
          CLOSED: 3,
          close: vi.fn(),
          send: vi.fn(),
          onclose: null,
          onopen: null,
          onerror: null,
        },
        send: vi.fn(),
        on: vi.fn(),
      };

      WS.mockReturnValue(mockWS);

      const connectPromise = webSocketSetup.connect();

      if (mockWS.ws.onerror) {
        mockWS.ws.onerror(new Error('Connection failed'));
      }

      const result = await connectPromise;

      expect(result).toBe(false);
    });
  });

  describe('setupPingInterval', () => {
    it('should set up an interval to call ping', () => {
      vi.useFakeTimers();
      const spyPing = vi.spyOn(webSocketSetup, 'ping');

      webSocketSetup.setupPingInterval();

      expect(webSocketSetup.pingIntervalId).not.toBeNull();
      vi.advanceTimersByTime(30000);
      expect(spyPing).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('ping', () => {
    it('should send ping message when WebSocket is open', async () => {
      webSocketSetup.ws = {
        send: vi.fn(),
        ws: {
          readyState: 1,
          OPEN: 1,
        },
      };

      await webSocketSetup.ping();

      expect(webSocketSetup.ws.send).toHaveBeenCalledWith({
        type: 'ping',
        message: {},
      });
    });

    it('should call reconnect if WebSocket is not open', async () => {
      const spyReconnect = vi
        .spyOn(webSocketSetup, 'reconnect')
        .mockResolvedValue(true);
      webSocketSetup.ws = {
        ws: {
          readyState: 3,
          OPEN: 1,
          CLOSED: 3,
        },
      };

      await webSocketSetup.ping();

      expect(webSocketSetup.isFirstReconnectAttempt).toBe(false);
      expect(spyReconnect).toHaveBeenCalled();
    });
  });

  describe('clearPingInterval', () => {
    it('should clear the existing interval when setting up a new one', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      webSocketSetup.pingIntervalId = setInterval(() => {}, 1000);

      webSocketSetup.setupPingInterval();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not call clearInterval if no interval exists', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      webSocketSetup.pingIntervalId = null;

      webSocketSetup.clearPingInterval();

      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    it('should close the current WebSocket and call connect', async () => {
      const spyConnect = vi
        .spyOn(webSocketSetup, 'connect')
        .mockResolvedValue(true);
      const spyClose = vi.spyOn(webSocketSetup.ws.ws, 'close');
      const spyReloadRoomsAndDiscussions = vi.spyOn(
        webSocketSetup,
        'reloadRoomsAndDiscussions',
      );

      const result = await webSocketSetup.reconnect();

      expect(spyClose).toHaveBeenCalled();
      expect(spyConnect).toHaveBeenCalled();
      expect(spyReloadRoomsAndDiscussions).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update user status from sessionStorage on successful connection', async () => {
      sessionStorage.setItem('statusAgent-mockProject', 'mockStatus');
      vi.spyOn(webSocketSetup, 'connect').mockResolvedValue(true);
      vi.spyOn(webSocketSetup, 'reloadRoomsAndDiscussions');

      await webSocketSetup.reconnect();

      expect(mockApp.updateUserStatus).toHaveBeenCalledWith('mockStatus');
    });

    it('should not update user status on failed connection', async () => {
      mockApp.updateUserStatus.mockClear();
      sessionStorage.setItem('statusAgent-mockProject', 'mockStatus');
      vi.spyOn(webSocketSetup, 'connect').mockResolvedValue(false);
      const spyReloadRoomsAndDiscussions = vi.spyOn(
        webSocketSetup,
        'reloadRoomsAndDiscussions',
      );

      await webSocketSetup.reconnect();

      expect(mockApp.updateUserStatus).not.toHaveBeenCalled();
      expect(spyReloadRoomsAndDiscussions).not.toHaveBeenCalled();
    });

    it('should return early if max reconnect attempts reached', async () => {
      webSocketSetup.reconnectAttempts = 5;
      const spyConnect = vi.spyOn(webSocketSetup, 'connect');
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await webSocketSetup.reconnect();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WebSocket] Max reconnect attempts reached, stopping reconnect attempts',
      );
      expect(spyConnect).not.toHaveBeenCalled();
      expect(result).toBeUndefined();

      consoleWarnSpy.mockRestore();
    });

    it('should not close WebSocket if already closed', async () => {
      webSocketSetup.ws.ws.readyState = 3;
      webSocketSetup.ws.ws.CLOSED = 3;
      const spyClose = vi.spyOn(webSocketSetup.ws.ws, 'close');
      vi.spyOn(webSocketSetup, 'connect').mockResolvedValue(true);

      await webSocketSetup.reconnect();

      expect(spyClose).not.toHaveBeenCalled();
    });
  });

  describe('calculateReconnectDelay', () => {
    it('should calculate exponential backoff delay', () => {
      webSocketSetup.reconnectAttempts = 1;
      const delay = webSocketSetup.calculateReconnectDelay();

      expect(delay).toBeGreaterThanOrEqual(10000);
      expect(delay).toBeLessThanOrEqual(11000);
    });

    it('should cap delay at maximum value', () => {
      webSocketSetup.reconnectAttempts = 10;
      const delay = webSocketSetup.calculateReconnectDelay();

      expect(delay).toBeLessThanOrEqual(webSocketSetup.MAX_RECONNECT_DELAY);
    });

    it('should add random jitter', () => {
      webSocketSetup.reconnectAttempts = 0;
      const delay1 = webSocketSetup.calculateReconnectDelay();
      const delay2 = webSocketSetup.calculateReconnectDelay();

      expect(delay1).toBeGreaterThanOrEqual(
        webSocketSetup.BASE_RECONNECT_DELAY,
      );
      expect(delay2).toBeGreaterThanOrEqual(
        webSocketSetup.BASE_RECONNECT_DELAY,
      );
    });
  });

  describe('reloadRoomsAndDiscussions', () => {
    it('should reload rooms and discussions with correct parameters', () => {
      dashboardStore.viewedAgent = { email: 'test@example.com' };

      webSocketSetup.reloadRoomsAndDiscussions();

      expect(roomsStore.getAll).toHaveBeenCalledTimes(3);
      expect(roomsStore.getAll).toHaveBeenCalledWith({
        offset: 0,
        concat: true,
        limit: 30,
        roomsType: 'ongoing',
        order: roomsStore.orderBy.ongoing,
        viewedAgent: 'test@example.com',
      });
      expect(roomsStore.getAll).toHaveBeenCalledWith({
        offset: 0,
        concat: true,
        limit: 30,
        roomsType: 'waiting',
        order: roomsStore.orderBy.waiting,
        viewedAgent: 'test@example.com',
      });
      expect(roomsStore.getAll).toHaveBeenCalledWith({
        offset: 0,
        concat: true,
        limit: 30,
        roomsType: 'flow_start',
        order: roomsStore.orderBy.flow_start,
        viewedAgent: 'test@example.com',
      });
      expect(discussionsStore.getAll).toHaveBeenCalledWith({
        viewedAgent: 'test@example.com',
      });
    });
  });

  describe('onclose handler', () => {
    it('should handle first reconnect attempt without delay', async () => {
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');
      const spyReconnect = vi
        .spyOn(webSocketSetup, 'reconnect')
        .mockResolvedValue(true);

      const mockWS = {
        ws: {
          readyState: 3,
          OPEN: 1,
          CLOSED: 3,
          close: vi.fn(),
          send: vi.fn(),
          onclose: null,
          onopen: null,
          onerror: null,
        },
        send: vi.fn(),
        on: vi.fn(),
      };

      WS.mockReturnValue(mockWS);
      webSocketSetup.isFirstReconnectAttempt = true;

      webSocketSetup.connect();

      expect(mockWS.ws.onclose).toBeDefined();
      await mockWS.ws.onclose();

      expect(webSocketSetup.isFirstReconnectAttempt).toBe(false);
      expect(spyReconnect).toHaveBeenCalled();
    });

    it('should handle subsequent reconnect attempts with delay', async () => {
      vi.useFakeTimers();
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');
      const spyReconnect = vi
        .spyOn(webSocketSetup, 'reconnect')
        .mockResolvedValue(true);
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const mockWS = {
        ws: {
          readyState: 3,
          OPEN: 1,
          CLOSED: 3,
          close: vi.fn(),
          send: vi.fn(),
          onclose: null,
          onopen: null,
          onerror: null,
        },
        send: vi.fn(),
        on: vi.fn(),
      };

      WS.mockReturnValue(mockWS);
      webSocketSetup.isFirstReconnectAttempt = false;
      webSocketSetup.reconnectAttempts = 0;

      webSocketSetup.connect();

      if (mockWS.ws.onclose) {
        await mockWS.ws.onclose();
      }

      expect(webSocketSetup.reconnectAttempts).toBe(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[WebSocket] Reconnect attempt 1, waiting'),
      );

      vi.advanceTimersByTime(6000);

      expect(spyReconnect).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});
