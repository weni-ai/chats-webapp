import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';

export default (discussion, { app }) => {
  const discussionStore = useDiscussions();
  const roomsStore = useRooms();
  discussionStore.removeDiscussion(discussion.uuid);

  if (app.$route.params.discussionId === discussion.uuid) {
    discussionStore.setActiveDiscussion(null);
    roomsStore.setActiveRoom(null);
  }
};
