import WS from '@/services/api/websocket/socket';
import env from '@/utils/env';

import listeners from './listeners';
import { useDashboard } from '@/store/modules/dashboard';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

export default class WebSocketSetup {
  THIRTY_SECONDS = 30000;
  FIVE_SECONDS = 5000;

  constructor({ app }) {
    this.app = app;
    this.pingIntervalId = null;
    this.isFirstReconnectAttempt = true;
  }

  reloadRoomsAndDiscussions() {
    const roomsStore = useRooms();
    const discussionsStore = useDiscussions();
    const dashboardStore = useDashboard();
    const { viewedAgent } = dashboardStore;
    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 100,
      roomsType: 'ongoing',
      order: roomsStore.orderBy.ongoing,
      viewedAgent: viewedAgent?.email,
    });
    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 100,
      roomsType: 'waiting',
      order: roomsStore.orderBy.waiting,
      viewedAgent: viewedAgent?.email,
    });
    roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 100,
      roomsType: 'flow_start',
      order: roomsStore.orderBy.flow_start,
      viewedAgent: viewedAgent?.email,
    });
    discussionsStore.getAll({
      viewedAgent: viewedAgent?.email,
    });
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
    this.app.ws = ws;
    this.ws.ws.onclose = () => {
      if (this.ws.ws.readyState === this.ws.ws.OPEN) return;

      const timestamp = new Date().toISOString();
      console.warn(
        timestamp,
        '[WebSocket] Connection closed, attempting to reconnect...',
      );

      if (this.isFirstReconnectAttempt) {
        this.isFirstReconnectAttempt = false;
        this.reconnect();
      } else {
        setTimeout(() => {
          this.reconnect();
        }, this.FIVE_SECONDS);
      }
    };

    this.ws.ws.onopen = () => {
      this.isFirstReconnectAttempt = true;
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
      this.reconnect();
    }
  }

  reconnect() {
    if (this.ws && this.ws.ws.readyState !== this.ws.ws.CLOSED) {
      this.ws.ws.close();
    }

    this.connect();

    this.reloadRoomsAndDiscussions();

    const sessionStorageStatus = sessionStorage.getItem(
      `statusAgent-${this.app.appProject}`,
    );
    this.app.updateUserStatus(sessionStorageStatus);
  }
}
