import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';
export async function resetChats() {
  await useDiscussionMessages().resetDiscussionMessages();
  await useRoomMessages().resetRoomMessages();
  await useDiscussions().setActiveDiscussion(null);
  await useRooms().setActiveRoom(null);
}
