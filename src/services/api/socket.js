import env from '@/utils/env';
import { getToken, getProject } from '@/utils/config';

export class Socket {
  /**
   * @type {WebSocket}
   */
  #ws;

  #handlers = [];

  constructor(url) {
    this.#ws = new WebSocket(url);
    this.#createOnMessageListener();
  }

  #createOnMessageListener() {
    this.#ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { action } = data;
      const content = JSON.parse(data.content);

      this.#handlers.forEach(({ message, callback }) => {
        if (message === action) callback(content);
      });
    };
  }

  on(message, callback) {
    const handler = {
      message,
      callback,
    };
    this.#handlers.push(handler);
  }
}

const token = getToken();
const project = getProject();

export const ws = new Socket(
  `${env('CHATS_WEBSOCKET_URL')}/agent/rooms?Token=${token}&project=${project}`,
);
