export default (discussion, { app }) => {
  app.$store.dispatch('chats/discussions/removeDiscussion', discussion.uuid);

  if (app.$route.params.discussionId === discussion.uuid) {
    app.$store.dispatch('chats/discussions/setActiveDiscussion', null);
    app.$store.dispatch('chats/rooms/setActiveRoom', null);
  }
};
