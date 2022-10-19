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

  send(message) {
    this.#ws.send(JSON.stringify(message));
  }
}

export const WS = Socket;
