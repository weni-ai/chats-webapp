import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocketSetup from '@/services/api/websocket/setup';
import WS from '@/services/api/websocket/socket';
import listeners from '@/services/api/websocket/listeners';
import { useDashboard } from '@/store/modules/dashboard';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useConfig } from '@/store/modules/config';
import KeycloakService from '@/services/keycloak';
import { moduleStorage } from '@/utils/storage';

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
vi.mock('@/store/modules/config');

vi.mock('@/services/keycloak', () => ({
  default: {
    keycloak: null,
  },
}));

vi.mock('@/utils/storage', () => ({
  moduleStorage: {
    getItem: vi.fn(),
  },
}));

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
  let configStore;
  beforeEach(() => {
    dashboardStore = {
      viewedAgent: null,
    };
    roomsStore = {
      getAll: vi.fn().mockResolvedValue(undefined),
      rooms: [],
      activeRoom: null,
      orderBy: {
        ongoing: 'ongoing',
        waiting: 'waiting',
        flow_start: 'flow_start',
      },
    };
    discussionsStore = {
      getAll: vi.fn(),
    };
    configStore = {
      socketStatus: '',
    };
    useDashboard.mockReturnValue(dashboardStore);
    useRooms.mockReturnValue(roomsStore);
    useDiscussions.mockReturnValue(discussionsStore);
    useConfig.mockReturnValue(configStore);
    KeycloakService.keycloak = null;
    moduleStorage.getItem.mockReturnValue(null);
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

    it('should return the managerWSUrl if viewedAgent has no email', () => {
      dashboardStore.viewedAgent = { name: 'No email' };

      const url = webSocketSetup.buildUrl();
      expect(url).toBe(
        'ws://mock-url/agent/rooms?Token=mockToken&project=mockProject',
      );
    });

    it('should prefer Keycloak token over appToken when available', () => {
      KeycloakService.keycloak = { token: 'keycloak-token' };
      dashboardStore.viewedAgent = { email: 'agent@example.com' };

      const url = webSocketSetup.buildUrl();
      expect(url).toContain('Token=keycloak-token');
    });
  });

  describe('reloadRoomsAndDiscussions', () => {
    it('should fetch waiting, ongoing, and flow_start rooms then discussions', async () => {
      dashboardStore.viewedAgent = { email: 'viewer@test.com' };

      await webSocketSetup.reloadRoomsAndDiscussions();

      expect(roomsStore.getAll).toHaveBeenCalledTimes(3);
      expect(roomsStore.getAll).toHaveBeenNthCalledWith(1, {
        offset: 0,
        concat: true,
        limit: 30,
        roomsType: 'waiting',
        order: 'waiting',
        viewedAgent: 'viewer@test.com',
        cleanRoomType: 'waiting',
      });
      expect(roomsStore.getAll).toHaveBeenNthCalledWith(2, {
        offset: 0,
        concat: true,
        limit: 100,
        roomsType: 'ongoing',
        order: 'ongoing',
        viewedAgent: 'viewer@test.com',
        cleanRoomType: 'ongoing',
      });
      expect(roomsStore.getAll).toHaveBeenNthCalledWith(3, {
        offset: 0,
        concat: true,
        limit: 100,
        roomsType: 'flow_start',
        order: 'flow_start',
        viewedAgent: 'viewer@test.com',
        cleanRoomType: 'flow_start',
      });
      expect(discussionsStore.getAll).toHaveBeenCalledWith({
        viewedAgent: 'viewer@test.com',
      });
    });

    it('should sync activeRoom when it still exists in rooms list', async () => {
      const active = { uuid: 'r1', title: 'Old' };
      const updated = { uuid: 'r1', title: 'Fresh' };
      roomsStore.activeRoom = active;
      roomsStore.rooms = [updated];

      await webSocketSetup.reloadRoomsAndDiscussions();

      expect(roomsStore.activeRoom).toBe(updated);
    });

    it('should clear activeRoom when it is no longer in rooms list', async () => {
      roomsStore.activeRoom = { uuid: 'missing' };
      roomsStore.rooms = [{ uuid: 'other' }];

      await webSocketSetup.reloadRoomsAndDiscussions();

      expect(roomsStore.activeRoom).toBe(null);
    });

    it('should not touch activeRoom when it is null', async () => {
      roomsStore.activeRoom = null;
      roomsStore.rooms = [{ uuid: 'x' }];

      await webSocketSetup.reloadRoomsAndDiscussions();

      expect(roomsStore.activeRoom).toBe(null);
    });

    it('should log when getAll throws', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      roomsStore.getAll.mockRejectedValueOnce(new Error('network'));

      await webSocketSetup.reloadRoomsAndDiscussions();

      expect(errSpy).toHaveBeenCalledWith(
        '[WebSocket] Failed to reload rooms after reconnect',
        expect.any(Error),
      );
      expect(discussionsStore.getAll).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });

  describe('connect', () => {
    let logSpy;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy?.mockRestore();
    });

    it('should initialize WS with the correct URL and call listeners', () => {
      const spySetupPingInterval = vi.spyOn(
        webSocketSetup,
        'setupPingInterval',
      );
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('mockUrl');

      webSocketSetup.connect();

      expect(WS).toHaveBeenCalledWith('mockUrl');
      expect(listeners).toHaveBeenCalledWith({
        ws: webSocketSetup.ws,
        app: mockApp,
      });
      expect(spySetupPingInterval).toHaveBeenCalled();
    });

    it('should set socketStatus to connecting then connected on open', () => {
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('ws://test');
      webSocketSetup.connect();

      expect(configStore.socketStatus).toBe('connecting');

      webSocketSetup.ws.ws.onopen();

      expect(configStore.socketStatus).toBe('connected');
    });

    it('should call updateUserStatus with session storage value on open', () => {
      moduleStorage.getItem.mockReturnValue('available');
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('ws://test');
      webSocketSetup.connect();

      webSocketSetup.ws.ws.onopen();

      expect(moduleStorage.getItem).toHaveBeenCalledWith(
        'statusAgent-mockProject',
        null,
        { useSession: true },
      );
      expect(mockApp.updateUserStatus).toHaveBeenCalledWith('available');
    });

    it('should reset reconnect state on successful open', () => {
      webSocketSetup.reconnectAttempts = 3;
      webSocketSetup.isFirstReconnectAttempt = false;
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('ws://test');
      webSocketSetup.connect();

      webSocketSetup.ws.ws.onopen();

      expect(webSocketSetup.reconnectAttempts).toBe(0);
      expect(webSocketSetup.isFirstReconnectAttempt).toBe(true);
    });

    it('should reload rooms when reopening after a reconnect', () => {
      const spyReload = vi.spyOn(webSocketSetup, 'reloadRoomsAndDiscussions');
      webSocketSetup.reconnectAttempts = 1;
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('ws://test');
      webSocketSetup.connect();

      webSocketSetup.ws.ws.onopen();

      expect(spyReload).toHaveBeenCalled();
    });

    it('should not reload rooms on first connection (reconnectAttempts is 0)', () => {
      const spyReload = vi.spyOn(webSocketSetup, 'reloadRoomsAndDiscussions');
      webSocketSetup.reconnectAttempts = 0;
      webSocketSetup.buildUrl = vi.fn().mockReturnValue('ws://test');
      webSocketSetup.connect();

      webSocketSetup.ws.ws.onopen();

      expect(spyReload).not.toHaveBeenCalled();
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

    it('should send ping when WebSocket is open', () => {
      const send = vi.fn();
      webSocketSetup.ws = {
        send,
        ws: {
          readyState: 1,
          OPEN: 1,
        },
      };

      webSocketSetup.ping();

      expect(send).toHaveBeenCalledWith({
        type: 'ping',
        message: {},
      });
    });

    it('should set isFirstReconnectAttempt false before reconnect when socket closed', () => {
      vi.spyOn(webSocketSetup, 'reconnect');
      webSocketSetup.isFirstReconnectAttempt = true;
      webSocketSetup.ws = {
        ws: {
          readyState: WebSocket.CLOSED,
          CLOSED: WebSocket.CLOSED,
          close: vi.fn(),
        },
      };

      webSocketSetup.ping();

      expect(webSocketSetup.isFirstReconnectAttempt).toBe(false);
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
    it('should close the current WebSocket and call connect', () => {
      const spyConnect = vi.spyOn(webSocketSetup, 'connect');
      const spyClose = vi.spyOn(webSocketSetup.ws.ws, 'close');

      webSocketSetup.reconnect();

      expect(spyClose).toHaveBeenCalled();
      expect(spyConnect).toHaveBeenCalled();
    });

    it('should not connect when max reconnect attempts reached', () => {
      const spyConnect = vi.spyOn(webSocketSetup, 'connect');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      webSocketSetup.reconnectAttempts = webSocketSetup.MAX_RECONNECT_ATTEMPTS;

      webSocketSetup.reconnect();

      expect(spyConnect).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        '[WebSocket] Max reconnect attempts reached, stopping auto reconnect attempts',
      );
      warnSpy.mockRestore();
    });

    it('should bypass max attempts when ignoreRetryCount is true', () => {
      const spyConnect = vi.spyOn(webSocketSetup, 'connect');
      webSocketSetup.reconnectAttempts = webSocketSetup.MAX_RECONNECT_ATTEMPTS;

      webSocketSetup.reconnect({ ignoreRetryCount: true });

      expect(spyConnect).toHaveBeenCalled();
    });

    it('should set isFirstReconnectAttempt when ignoreRetryCount is true', () => {
      vi.spyOn(webSocketSetup, 'connect');
      webSocketSetup.isFirstReconnectAttempt = false;

      webSocketSetup.reconnect({ ignoreRetryCount: true });

      expect(webSocketSetup.isFirstReconnectAttempt).toBe(true);
    });

    it('should not call close when socket is already CLOSED', () => {
      const close = vi.fn();
      webSocketSetup.ws = {
        ws: {
          readyState: 3,
          CLOSED: 3,
          close,
        },
      };
      vi.spyOn(webSocketSetup, 'connect');

      webSocketSetup.reconnect();

      expect(close).not.toHaveBeenCalled();
    });
  });
});
