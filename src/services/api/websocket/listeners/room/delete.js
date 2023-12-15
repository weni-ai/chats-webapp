export default async (room, { app }) => {
  app.$store.dispatch('chats/rooms/removeRoom', room.uuid);
};
