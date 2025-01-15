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
    enableReply
    @scroll-top="searchForMoreMessages"
  />
</template>
<script>
import { mapActions, mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

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
          this.resetRoomMessages();
          this.page = 0;
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

    async handlingGetRoomMessages() {
      this.isLoading = true;

      this.getRoomMessages({
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
        this.handlingGetRoomMessages();
      }
    },
  },
};
</script>
