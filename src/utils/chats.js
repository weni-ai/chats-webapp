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

export function formatContactName(room) {
  let contactName = '';
  if (room?.service_chat) {
    contactName += `${room.service_chat} | `;
  }
  if (room?.protocol) {
    contactName += `${room.protocol} | `;
  }
  return room?.contact.name ? (contactName + room?.contact.name).trim() : '';
}
