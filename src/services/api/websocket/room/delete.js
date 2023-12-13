export default async ({ room, store }) => {
  store.dispatch('chats/rooms/removeRoom', room.uuid);
};
