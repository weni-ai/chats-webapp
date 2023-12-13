export default async ({ message, store, me }) => {
  if (me.email === message.user?.email) {
    return;
  }
  store.dispatch('chats/roomMessages/addMessage', message);
};
