import WS from '@/services/api/websocket/socket';
import env from '@/utils/env';

import listeners from './listeners';

export default class WebSocketSetup {
  THIRTY_SECONDS = 30000;

  constructor({ app }) {
    this.app = app;
    this.pingIntervalId = null;
  }

  buildUrl() {
    const { appToken, appProject } = this.app;
    const { viewedAgent } = this.app.$route.params;

    const baseUrl = env('CHATS_WEBSOCKET_URL');
    const commonParams = `Token=${appToken}&project=${appProject}`;
    const agentWSUrl = `${baseUrl}/manager/rooms?${commonParams}&user_email=${viewedAgent}`;
    const managerWSUrl = `${baseUrl}/agent/rooms?${commonParams}`;

    return viewedAgent ? agentWSUrl : managerWSUrl;
  }

  connect() {
    const url = this.buildUrl();
    const ws = new WS(url);

    this.ws = ws;
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
    this.ws.ws.close();
    this.connect();
  }
}
