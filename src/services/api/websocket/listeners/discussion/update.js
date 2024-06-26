import SoundNotification from '@/services/api/websocket/soundNotification';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';

export default (discussion, { app }) => {
  const roomsStore = useRooms();
  const discussionStore = useDiscussions();
  const { discussions, activeDiscussion } = discussionStore;
  const isNewDiscussion = !discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );

  if (isNewDiscussion && discussion.created_by !== app.me.email) {
    discussionStore.addDiscussion(discussion);

    const notification = new SoundNotification('achievement-confirmation');
    notification.notify();
  }

  if (activeDiscussion?.uuid === discussion.uuid) {
    discussionStore.setActiveDiscussion(discussion);
    roomsStore.setActiveRoom(null);
  }

  if (
    discussion.added_agents.length >= 2 &&
    !discussion.added_agents.includes(app.me.email)
  ) {
    discussionStore.removeDiscussion(discussion.uuid);
  }
};
