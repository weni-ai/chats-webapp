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

      // Mock the WebSocket to trigger onopen immediately
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

      // Simulate successful connection
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
    });

    it('should return false on connection timeout', async () => {
      vi.useFakeTimers();
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');

      const connectPromise = webSocketSetup.connect();

      // Fast-forward past the timeout
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

      // Simulate connection error
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
    it('should call reconnect if WebSocket is not open', () => {
      const spyReconnect = vi.spyOn(webSocketSetup, 'reconnect');
      webSocketSetup.ws = {
        ws: {
          readyState: WebSocket.CLOSED,
          CLOSED: WebSocket.CLOSED,
          close: vi.fn(),
        },
      };

      webSocketSetup.ping();

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

      const result = await webSocketSetup.reconnect();

      expect(spyClose).toHaveBeenCalled();
      expect(spyConnect).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update user status from sessionStorage on successful connection', async () => {
      sessionStorage.setItem('statusAgent-mockProject', 'mockStatus');
      vi.spyOn(webSocketSetup, 'connect').mockResolvedValue(true);

      await webSocketSetup.reconnect();

      expect(mockApp.updateUserStatus).toHaveBeenCalledWith('mockStatus');
    });

    it('should not update user status on failed connection', async () => {
      // Reset the mock to clear any previous calls
      mockApp.updateUserStatus.mockClear();
      sessionStorage.setItem('statusAgent-mockProject', 'mockStatus');
      vi.spyOn(webSocketSetup, 'connect').mockResolvedValue(false);

      await webSocketSetup.reconnect();

      expect(mockApp.updateUserStatus).not.toHaveBeenCalled();
    });
  });
});
