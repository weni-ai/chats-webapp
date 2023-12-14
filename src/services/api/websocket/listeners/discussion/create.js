import SoundNotification from '@/services/api/websocket/soundNotification';

export default ({ discussion, store, me }) => {
  if (discussion.created_by && discussion.created_by === me.email) return;

  const { discussions } = store.state.chats.discussions;
  const existentDiscussion = discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );
  if (existentDiscussion) return;

  store.dispatch('chats/discussions/addDiscussion', discussion);
  const notification = new SoundNotification('achievement-confirmation');
  notification.notify();
};
