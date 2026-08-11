export class SocketNotConnectedError extends Error {
  constructor(message = 'WebSocket is not connected') {
    super(message);
    this.name = 'SocketNotConnectedError';
  }
}

export class SocketTimeoutError extends Error {
  constructor(message = 'WebSocket request timed out') {
    super(message);
    this.name = 'SocketTimeoutError';
  }
}

export class SocketDisconnectedError extends Error {
  constructor(message = 'WebSocket disconnected while request was pending') {
    super(message);
    this.name = 'SocketDisconnectedError';
  }
}

export class SocketMessageCreateError extends Error {
  constructor(errorCode, errorMessage) {
    super(errorMessage || 'Failed to create message via WebSocket');
    this.name = 'SocketMessageCreateError';
    this.errorCode = errorCode;
  }
}
