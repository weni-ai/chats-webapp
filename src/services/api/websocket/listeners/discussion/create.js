import SoundNotification from '@/services/api/websocket/soundNotification';

export default (discussion, { app }) => {
  if (discussion.created_by && discussion.created_by === app.me.email) return;

  const { discussions } = app.$store.state.chats.discussions;
  const existentDiscussion = discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );
  if (existentDiscussion) return;

  app.$store.dispatch('chats/discussions/addDiscussion', discussion);
  const notification = new SoundNotification('achievement-confirmation');
  notification.notify();
};
