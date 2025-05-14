<template>
  <ChatSummary
    v-if="
      (!isLoadingMessages || silentLoadingMessages) &&
      showChatSummary &&
      showRoomSummary
    "
    class="chat-summary"
    :isGeneratingSummary="isLoadingActiveRoomSummary"
    :summaryText="activeRoomSummary"
    @close="showChatSummary = false"
  />
  <ChatMessages
    :chatUuid="room?.uuid || ''"
    :messages="roomMessages"
    :messagesNext="roomMessagesNext || ''"
    :messagesPrevious="roomMessagesPrevious || ''"
    :messagesSorted="roomMessagesSorted"
    :messagesSendingUuids="roomMessagesSendingUuids"
    :messagesFailedUuids="roomMessagesFailedUuids"
    :resendMessages="roomResendMessages"
    :resendMedia="roomResendMedia"
    :tags="room?.tags"
    :isLoading="isLoadingMessages"
    :isClosedChat="!!room?.ended_at"
    :enableReply="false"
    @scroll-top="searchForMoreMessages"
  />
</template>
<script>
import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';
import ChatSummary from '@/layouts/ChatsLayout/components/ChatSummary/index.vue';

export default {
  name: 'RoomMessages',

  components: { ChatMessages, ChatSummary },

  props: {
    showRoomSummary: {
      type: Boolean,
      default: false,
    },
  },

  data: () => {
    return {
      page: 0,
      limit: 20,
      isLoadingMessages: true,
      silentLoadingMessages: false,
      isLoadingSummary: false,
      showChatSummary: true,
      getRoomSummaryInterval: null,
      roomSummary: '',
    };
  },

  computed: {
    ...mapWritableState(useRooms, [
      'activeRoomSummary',
      'isLoadingActiveRoomSummary',
    ]),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useRoomMessages, [
      'roomMessages',
      'roomMessagesNext',
      'roomMessagesPrevious',
      'roomMessagesSorted',
      'roomMessagesSendingUuids',
      'roomMessagesFailedUuids',
    ]),
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomUuid) {
        if (roomUuid) {
          this.showChatSummary = true;
          this.resetRoomMessages();
          this.page = 0;
          this.handlingGetRoomSummary();
          await this.handlingGetRoomMessages();
        }
      },
    },
  },

  methods: {
    ...mapActions(useRoomMessages, {
      roomResendMessages: 'resendRoomMessages',
      roomResendMedia: 'resendRoomMedia',
      getRoomMessages: 'getRoomMessages',
      resetRoomMessages: 'resetRoomMessages',
    }),

    handlingGetRoomMessages() {
      this.isLoadingMessages = true;

      this.getRoomMessages({
        offset: this.page * this.limit,
        limit: this.limit,
      })
        .then(() => {})
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          this.isLoadingMessages = false;
          this.silentLoadingMessages = false;
        });
    },

    getRoomSummary() {
      setTimeout(() => {
        this.isLoadingActiveRoomSummary = false;
        this.activeRoomSummary =
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In nulla ex, mollis eget magna in, lacinia hendrerit erat. Aliquam erat volutpat. Nulla quis dui felis. Integer pulvinar neque sit amet suscipit efficitur. Sed accumsan metus a feugiat mattis. Nunc pellentesque massa in lorem pulvinar maximus. Morbi tempor imperdiet nisl, ut cursus risus leo.';
        clearInterval(this.getRoomSummaryInterval);
      }, 2000);
    },

    handlingGetRoomSummary() {
      this.activeRoomSummary = '';
      this.isLoadingActiveRoomSummary = true;
      this.getRoomSummaryInterval = setInterval(this.getRoomSummary, 3000);
    },

    searchForMoreMessages() {
      if (this.roomMessagesNext) {
        this.page += 1;
        this.silentLoadingMessages = true;
        this.handlingGetRoomMessages();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-summary {
  // min-width: 100%;
  // min-height: 130px;
  /* position: absolute; */
  margin-left: -16px;
  z-index: 3;
}
</style>
