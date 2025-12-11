import WS from '@/services/api/websocket/socket';
import env from '@/utils/env';

import listeners from './listeners';
import { useDashboard } from '@/store/modules/dashboard';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useConfig } from '@/store/modules/config';
import { moduleStorage } from '@/utils/storage';

export default class WebSocketSetup {
  TIME_INTERVAL = 15000; // 15 seconds
  RECONNECT_DELAY = 5000; // 5 seconds
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

    const getWaitingRooms = roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 30,
      roomsType: 'waiting',
      order: roomsStore.orderBy.waiting,
      viewedAgent: viewedAgent?.email,
      cleanRoomType: 'waiting',
    });

    const getOngoingRooms = roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 100,
      roomsType: 'ongoing',
      order: roomsStore.orderBy.ongoing,
      viewedAgent: viewedAgent?.email,
      cleanRoomType: 'ongoing',
    });

    const getFlowStartRooms = roomsStore.getAll({
      offset: 0,
      concat: true,
      limit: 100,
      roomsType: 'flow_start',
      order: roomsStore.orderBy.flow_start,
      viewedAgent: viewedAgent?.email,
      cleanRoomType: 'flow_start',
    });

    Promise.all([getWaitingRooms, getOngoingRooms, getFlowStartRooms]).then(
      () => {
        if (roomsStore.activeRoom) {
          const existActiveRoomGettedRooms = roomsStore.rooms.find(
            (room) => room.uuid === roomsStore.activeRoom.uuid,
          );
          if (existActiveRoomGettedRooms) {
            roomsStore.activeRoom = existActiveRoomGettedRooms;
          } else {
            roomsStore.activeRoom = null;
          }
        }
      },
    );

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

  connect({ ignoreRetryCount } = {}) {
    const url = this.buildUrl();
    const ws = new WS(url);
    const configStore = useConfig();
    configStore.socketStatus = 'connecting';

    this.ws = ws;

    this.ws.ws.onclose = () => {
      configStore.socketStatus = 'closed';
      if (this.ws.ws.readyState === this.ws.ws.OPEN) return;

      const timestamp = new Date().toISOString();

      if (this.isFirstReconnectAttempt) {
        console.warn(
          timestamp,
          '[WebSocket] Connection closed, attempting to reconnect...',
        );
        this.isFirstReconnectAttempt = false;
        if (!ignoreRetryCount) this.reconnect();
      } else {
        console.warn(
          timestamp,
          `[WebSocket] Reconnect attempt ${this.reconnectAttempts}, waiting ${this.RECONNECT_DELAY}ms...`,
        );

        if (this.reconnectAttempts <= 5) {
          setTimeout(() => {
            this.reconnect();
          }, this.RECONNECT_DELAY);
        }
      }
    };

    this.ws.ws.onopen = () => {
      if (this.reconnectAttempts > 0) {
        this.reloadRoomsAndDiscussions();
      }

      configStore.socketStatus = 'connected';

      const sessionStorageStatus = moduleStorage.getItem(
        `statusAgent-${this.app.appProject}`,
        null,
        {
          useSession: true,
        },
      );

      this.app.updateUserStatus(sessionStorageStatus);

      const timestamp = new Date().toISOString();
      console.log(timestamp, '[WebSocket] Connection established successfully');

      this.isFirstReconnectAttempt = true;
      this.reconnectAttempts = 0; // Reset attempts counter on successful connection
    };

    listeners({ ws, app: this.app });
    this.setupPingInterval();
  }

  setupPingInterval() {
    this.clearPingInterval();

    this.pingIntervalId = setInterval(() => {
      this.ping();
    }, this.TIME_INTERVAL);
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

  reconnect({ ignoreRetryCount } = {}) {
    if (
      this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS &&
      !ignoreRetryCount
    ) {
      console.warn(
        '[WebSocket] Max reconnect attempts reached, stopping auto reconnect attempts',
      );
      return;
    }

    if (ignoreRetryCount) this.isFirstReconnectAttempt = true;

    this.reconnectAttempts++;

    if (this.ws && this.ws.ws.readyState !== this.ws.ws.CLOSED) {
      this.ws.ws.close();
    }

    this.connect({ ignoreRetryCount });
  }
}
