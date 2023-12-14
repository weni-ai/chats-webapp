import SoundNotification from '@/services/api/websocket/soundNotification';

export default ({ discussion, store, me }) => {
  const { discussions, activeDiscussion } = store.state.chats.discussions;
  const isNewDiscussion = !discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );

  if (isNewDiscussion && discussion.created_by !== me.email) {
    store.dispatch('chats/discussions/addDiscussion', discussion);

    const notification = new SoundNotification('achievement-confirmation');
    notification.notify();
  }

  if (activeDiscussion?.uuid === discussion.uuid) {
    store.dispatch('chats/discussions/setActiveDiscussion', discussion);
    store.dispatch('chats/rooms/setActiveRoom', null);
  }

  if (discussion.added_agents.length >= 2 && !discussion.added_agents.includes(me.email)) {
    store.dispatch('chats/discussions/removeDiscussion', discussion.uuid);
  }
};
