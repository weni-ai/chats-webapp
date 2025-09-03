export default (content, { app }) => {
  const { status, user_disconnected_agent } = content;

  if (user_disconnected_agent && status) {
    app.updateUserStatusFromWebSocket(status, user_disconnected_agent);
  }
};
