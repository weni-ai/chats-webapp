import SoundNotification from '@/services/api/websocket/soundNotification';

import { useDiscussions } from '@/store/modules/chats/discussions';

export default (discussion, { app }) => {
  const discussionStore = useDiscussions();
  if (discussion.created_by && discussion.created_by === app.me.email) return;

  const { discussions } = discussionStore;
  const existentDiscussion = discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );

  if (existentDiscussion) return;

  discussionStore.addDiscussion(discussion);
  discussionStore.discussionsCount++;

  const notification = new SoundNotification('achievement-confirmation');
  notification.notify();
};
