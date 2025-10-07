export default (content, { app }) => {
  const { user_disconnected_agent } = content;

  if (user_disconnected_agent) {
    app.updateUserStatusFromWebSocket('OFFLINE', user_disconnected_agent, true);
  }
};
