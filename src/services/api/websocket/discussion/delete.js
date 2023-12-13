export default ({ discussion, store, route }) => {
  store.dispatch('chats/discussions/removeDiscussion', discussion.uuid);

  if (route.params.discussionId === discussion.uuid) {
    store.dispatch('chats/discussions/setActiveDiscussion', null);
    store.dispatch('chats/rooms/setActiveRoom', null);
  }
};
