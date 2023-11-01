<template>
  <chat-messages
    v-if="roomUuid"
    :chatUuid="roomUuid"
    :messages="roomMessages"
    :messagesSorted="roomMessagesSorted"
    :messagesSendingUuids="roomMessagesSendingUuids"
    :messagesFailedUuids="roomMessagesFailedUuids"
    :resendMessages="roomResendMessages"
    :resendMessage="roomResendMessage"
    :resendMedia="roomResendMedia"
    @scrollTop="searchForMoreMessages"
  />
</template>
<script>
import { mapActions, mapState } from 'vuex';

import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';

export default {
  name: 'HomeRoomMessages',

  components: { ChatMessages },

  data: () => {
    return {
      page: 0,
      limit: 20,
    };
  },

  computed: {
    ...mapState({
      roomUuid: (state) => state.chats.rooms.activeRoom?.uuid,
      roomMessages: (state) => state.chats.roomMessages.roomMessages,
      roomMessagesNext: (state) => state.chats.roomMessages.roomMessagesNext,
      roomMessagesSorted: (state) => state.chats.roomMessages.roomMessagesSorted,
      roomMessagesSendingUuids: (state) => state.chats.roomMessages.roomMessagesSendingUuids,
      roomMessagesFailedUuids: (state) => state.chats.roomMessages.roomMessagesFailedUuids,
    }),
  },

  methods: {
    ...mapActions({
      roomResendMessages: 'chats/roomMessages/resendMessages',
      roomResendMessage: 'chats/roomMessages/roomResendMessage',
      roomResendMedia: 'chats/roomMessages/resendMedia',
    }),

    async getRoomMessages() {
      await this.$store
        .dispatch('chats/roomMessages/getRoomMessages', {
          offset: this.page * this.limit,
          limit: this.limit,
        })
        .then(() => {
          this.$emit('handle-room-skeleton', false);
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
    roomUuid: {
      immediate: true,
      handler(roomUuid) {
        if (roomUuid) {
          this.getRoomMessages();
        }
      },
    },
  },
};
</script>
