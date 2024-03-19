import SoundNotification from '@/services/api/websocket/soundNotification';

export default (discussion, { app }) => {
  const { discussions, activeDiscussion } = app.$store.state.chats.discussions;
  const isNewDiscussion = !discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );

  if (isNewDiscussion && discussion.created_by !== app.me.email) {
    app.$store.dispatch('chats/discussions/addDiscussion', discussion);

    const notification = new SoundNotification('achievement-confirmation');
    notification.notify();
  }

  if (activeDiscussion?.uuid === discussion.uuid) {
    app.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
    app.$store.dispatch('chats/rooms/setActiveRoom', null);
  }

  if (
    discussion.added_agents.length >= 2 &&
    !discussion.added_agents.includes(app.me.email)
  ) {
    app.$store.dispatch('chats/discussions/removeDiscussion', discussion.uuid);
  }
};
