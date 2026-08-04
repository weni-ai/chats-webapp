let activeConnection = null;

export const setActiveConnection = (connection) => {
  activeConnection = connection;
};

export const getActiveConnection = () => activeConnection;

export const isSocketOpen = () =>
  activeConnection?.ws?.ws?.readyState === WebSocket.OPEN;
