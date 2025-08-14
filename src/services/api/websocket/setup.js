import WS from '@/services/api/websocket/socket';
import env from '@/utils/env';

import listeners from './listeners';
import { useDashboard } from '@/store/modules/dashboard';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

export default class WebSocketSetup {
  THIRTY_SECONDS = 30000;
  BASE_RECONNECT_DELAY = 5000; // 5 seconds
  MAX_RECONNECT_DELAY = 60000; // 60 seconds
  MAX_RECONNECT_ATTEMPTS = 5;

  constructor({ app }) {
    this.app = app;
    this.pingIntervalId = null;
    this.isFirstReconnectAttempt = true;
    this.reconnectAttempts = 0;
  }

  reloadRoomsAndDiscussions() {
    const roomsStore = useRooms();
    const discussionsStore = useDiscussions();
    const dashboardStore = useDashboard();
    const { viewedAgent } = dashboardStore;
    const limit = 30;

    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit,
      roomsType: 'ongoing',
      order: roomsStore.orderBy.ongoing,
      viewedAgent: viewedAgent?.email,
    });
    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit,
      roomsType: 'waiting',
      order: roomsStore.orderBy.waiting,
      viewedAgent: viewedAgent?.email,
    });
    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit,
      roomsType: 'flow_start',
      order: roomsStore.orderBy.flow_start,
      viewedAgent: viewedAgent?.email,
    });
    discussionsStore.getAll({
      viewedAgent: viewedAgent?.email,
    });
  }

  calculateReconnectDelay() {
    // Exponential backoff: delay = baseDelay * (2 ^ attempts) + random jitter
    const exponentialDelay =
      this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);

    // Add random jitter (0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;

    // Cap at maximum delay
    const delay = Math.min(exponentialDelay + jitter, this.MAX_RECONNECT_DELAY);

    return Math.floor(delay);
  }

  buildUrl() {
    const dashboardStore = useDashboard();
    const { appToken, appProject } = this.app;

    const { viewedAgent } = dashboardStore;

    const baseUrl = env('CHATS_WEBSOCKET_URL');
    const commonParams = `Token=${appToken}&project=${appProject}`;
    const agentWSUrl = `${baseUrl}/manager/rooms?${commonParams}&user_email=${viewedAgent?.email}`;
    const managerWSUrl = `${baseUrl}/agent/rooms?${commonParams}`;

    return viewedAgent?.email ? agentWSUrl : managerWSUrl;
  }

  connect() {
    const url = this.buildUrl();
    const ws = new WS(url);

    this.ws = ws;
    this.ws.ws.onclose = () => {
      if (this.ws.ws.readyState === this.ws.ws.OPEN) return;

      const timestamp = new Date().toISOString();

      if (this.isFirstReconnectAttempt) {
        console.warn(
          timestamp,
          '[WebSocket] Connection closed, attempting to reconnect...',
        );
        this.isFirstReconnectAttempt = false;
        this.reconnect();
      } else {
        const delay = this.calculateReconnectDelay();

        console.warn(
          timestamp,
          `[WebSocket] Reconnect attempt ${this.reconnectAttempts}, waiting ${delay}ms...`,
        );

        setTimeout(() => {
          this.reconnect();
        }, delay);
      }
    };

    this.ws.ws.onopen = () => {
      if (this.reconnectAttempts > 0) {
        this.reloadRoomsAndDiscussions();
      }

      this.isFirstReconnectAttempt = true;
      this.reconnectAttempts = 0; // Reset attempts counter on successful connection

      const sessionStorageStatus = sessionStorage.getItem(
        `statusAgent-${this.app.appProject}`,
      );
      this.app.updateUserStatus(sessionStorageStatus);

      const timestamp = new Date().toISOString();
      console.log(timestamp, '[WebSocket] Connection established successfully');
    };

    listeners({ ws, app: this.app });
    this.setupPingInterval();
  }

  setupPingInterval() {
    this.clearPingInterval();

    this.pingIntervalId = setInterval(() => {
      this.ping();
    }, this.THIRTY_SECONDS);
  }

  clearPingInterval() {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
    }
  }

  ping() {
    const isWebSocketOpen = this.ws.ws.readyState === this.ws.ws.OPEN;
    if (isWebSocketOpen) {
      this.ws.send({
        type: 'ping',
        message: {},
      });
    } else {
      // Reset first attempt flag so exponential backoff applies
      this.isFirstReconnectAttempt = false;
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn(
        '[WebSocket] Max reconnect attempts reached, stopping reconnect attempts',
      );
      return;
    }

    this.reconnectAttempts++;

    if (this.ws && this.ws.ws.readyState !== this.ws.ws.CLOSED) {
      this.ws.ws.close();
    }

    this.connect();
  }
}
