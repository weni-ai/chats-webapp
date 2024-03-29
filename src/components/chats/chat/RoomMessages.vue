<template>
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
    :isLoading="isLoading"
    :isClosedChat="!!room?.ended_at"
    @scrollTop="searchForMoreMessages"
  />
</template>
<script>
import { mapActions, mapState } from 'vuex';

import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';

export default {
  name: 'RoomMessages',

  components: { ChatMessages },

  data: () => {
    return {
      page: 0,
      limit: 20,
      isLoading: true,
    };
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      roomMessages: (state) => state.chats.roomMessages.roomMessages,
      roomMessagesNext: (state) => state.chats.roomMessages.roomMessagesNext,
      roomMessagesPrevious: (state) =>
        state.chats.roomMessages.roomMessagesPrevious,
      roomMessagesSorted: (state) =>
        state.chats.roomMessages.roomMessagesSorted,
      roomMessagesSendingUuids: (state) =>
        state.chats.roomMessages.roomMessagesSendingUuids,
      roomMessagesFailedUuids: (state) =>
        state.chats.roomMessages.roomMessagesFailedUuids,
    }),
  },

  methods: {
    ...mapActions({
      roomResendMessages: 'chats/roomMessages/resendRoomMessages',
      roomResendMedia: 'chats/roomMessages/resendRoomMedia',
    }),

    async getRoomMessages() {
      this.isLoading = true;
      await this.$store
        .dispatch('chats/roomMessages/getRoomMessages', {
          offset: this.page * this.limit,
          limit: this.limit,
        })
        .then(() => {
          this.isLoading = false;
        })
        .catch((error) => {
          console.error(error);
        });
    },

    searchForMoreMessages() {
      if (this.roomMessagesNext) {
        this.page += 1;
        this.getRoomMessages();
      }
    },
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomUuid) {
        if (roomUuid) {
          await this.$store.dispatch('chats/roomMessages/resetRoomMessages');
          this.page = 0;
          this.getRoomMessages();
        }
      },
    },
  },
};
</script>
