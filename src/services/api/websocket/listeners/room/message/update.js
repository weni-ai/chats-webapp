export default async (message, { app }) => {
  if (app.me.email === message.user?.email) {
    return;
  }
  app.$store.dispatch('chats/roomMessages/addMessage', message);
};
