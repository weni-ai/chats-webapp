<template>
  <unnnic-chats-contact
    :username="room.contact.name"
    :lastMessage="lastMessage"
    :waitingTime="waitingTimeComputed"
    :unreadMessages="unreadMessages"
    :tabindex="0"
    :selected="room.uuid === activeRoomId"
    :locale="locale"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
  </unnnic-chats-contact>
</template>

<script>
import { mapState } from 'vuex';

const ONE_MINUTE_IN_MILLISECONDS = 60000;

export default {
  name: 'ContactRoom',

  props: {
    room: {
      type: Object,
      required: true,
    },
  },

  mounted() {
    const randomPeriodInMilliseconds = Math.ceil(Math.random() * 30 + 1) * 1000;

    if (this.room.waitingTime) {
      this.waitingTime = this.room.waitingTime;
      this.timer = setInterval(() => {
        this.waitingTime += 1;
        // ensures that all chats waiting times don't update at same time
      }, ONE_MINUTE_IN_MILLISECONDS + randomPeriodInMilliseconds);
    }
  },

  destroyed() {
    clearInterval(this.timer);
  },

  data: () => ({
    waitingTime: 0,
    timer: null,
  }),

  computed: {
    ...mapState({
      newMessages(state) {
        return state.chats.rooms.newMessagesByRoom[this.room.uuid]?.messages;
      },
      activeRoomId: (state) => state.chats.rooms.activeRoom?.uuid,
    }),
    lastMessage() {
      const { newMessages, room } = this;
      return newMessages?.[newMessages.length - 1]?.text || room?.last_message || '';
    },
    waitingTimeComputed() {
      const { waitingTime } = this;
      if (waitingTime !== 0) {
        return this.$t('waiting_for.minutes', waitingTime);
      }
      return 0;
    },
    unreadMessages() {
      const { room, newMessages } = this;
      return room.unread_msgs + (newMessages?.length || 0);
    },
    locale() {
      return this.$i18n.locale === 'en-us' ? 'en' : this.$i18n.locale;
    },
  },
};
</script>
