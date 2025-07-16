import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';

export default (discussion, { app }) => {
  const discussionStore = useDiscussions();
  const roomsStore = useRooms();

  const existDiscussion = discussionStore.discussions.find(
    (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
  );

  if (!existDiscussion) return;

  discussionStore.removeDiscussion(discussion.uuid);
  discussionStore.discussionsCount--;

  if (app.$route.params.discussionId === discussion.uuid) {
    discussionStore.setActiveDiscussion(null);
    roomsStore.setActiveRoom(null);
  }
};
