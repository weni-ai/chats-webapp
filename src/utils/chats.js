import store from '@/store';

// eslint-disable-next-line import/prefer-default-export
export async function resetChats() {
  await store.dispatch('chats/discussionMessages/resetDiscussionMessages');
  await store.dispatch('chats/roomMessages/resetRoomMessages');
  await store.dispatch('chats/discussions/setActiveDiscussion', null);
  await store.dispatch('chats/rooms/setActiveRoom', null);
}
