import env from '@/utils/env';
import { get } from '@/utils/token';

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

const token = get();
export const ws = new Socket(
  `${env(
    'CHATS_WEBSOCKET_URL',
  )}/agent/rooms?Token=${token}&project=34a93b52-231e-11ed-861d-0242ac120002`,
);
