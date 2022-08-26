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

export const ws = new Socket(
  `${process.env.VUE_APP_CHATS_WEBSOCKET_URL}/agent/rooms?Token=4215e6d6666e54f7db9f98100533aa68909fd855&project=34a93b52-231e-11ed-861d-0242ac120002`,
);
