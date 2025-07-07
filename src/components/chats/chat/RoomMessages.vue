<template>
  <ChatSummary
    v-if="
      (!isLoadingMessages || silentLoadingMessages) &&
      openChatSummary &&
      showRoomSummary &&
      enableRoomSummary &&
      room
    "
    class="chat-summary"
    :isGeneratingSummary="isLoadingActiveRoomSummary"
    :summaryText="activeRoomSummary"
    @close="openChatSummary = false"
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

import RoomService from '@/services/api/resources/chats/room';
import { useConfig } from '@/store/modules/config';

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
      openChatSummary: true,
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
    ...mapState(useConfig, {
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
    }),
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomUuid) {
        if (roomUuid) {
          this.resetRoomMessages();
          this.page = 0;
          await this.handlingGetRoomMessages();
          if (this.enableRoomSummary) {
            clearInterval(this.getRoomSummaryInterval);
            this.openChatSummary = true;
            this.handlingGetRoomSummary();
          }
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

    setSummaryText(text) {
      this.isLoadingActiveRoomSummary = false;
      this.activeRoomSummary = text;
      clearInterval(this.getRoomSummaryInterval);
    },

    async getRoomSummary() {
      try {
        const { status, summary } = await RoomService.getSummary({
          roomUuid: this.room.uuid,
        });
        if (status === 'DONE') {
          this.setSummaryText(summary);
        }
        if (status === 'UNAVAILABLE') {
          const unavailableText = this.$t('chats.summary.unavailable');
          this.setSummaryText(unavailableText);
        }
      } catch (error) {
        console.log(error);
        const errorText = this.$t('chats.summary.error');
        this.setSummaryText(errorText);
      }
    },

    handlingGetRoomSummary() {
      this.activeRoomSummary = '';
      this.isLoadingActiveRoomSummary = true;
      this.getRoomSummary();
      this.getRoomSummaryInterval = setInterval(this.getRoomSummary, 5000);
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
  margin-left: -$unnnic-spacing-sm;
  z-index: 3;
}
</style>
