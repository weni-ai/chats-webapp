<template>
  <section
    class="room-card__container"
    :class="{ 'room-card__container--with-selection': withSelection }"
  >
    <UnnnicCheckbox
      v-if="withSelection"
      :modelValue="checkboxValue"
      size="sm"
      class="room-card__checkbox"
      @change="checkboxValue = $event"
    />
    <UnnnicChatsContact
      :title="room.contact.name"
      :lastMessage="lastMessage"
      :waitingTime="waitingTimeComputed"
      :unreadMessages="unreadMessages"
      :tabindex="0"
      :selected="room.uuid === activeRoomId && active"
      :locale="locale"
      @click="$emit('click')"
      @keypress.enter="$emit('click')"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';

const ONE_MINUTE_IN_MILLISECONDS = 60000;

export default {
  name: 'RoomCard',

  props: {
    room: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    withSelection: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click', 'update-selected'],

  data: () => ({
    waitingTime: 0,
    timer: null,
    checkboxValue: false,
  }),

  computed: {
    ...mapState(useRooms, {
      newMessages(store) {
        return store.newMessagesByRoom[this.room.uuid]?.messages;
      },
      activeRoomId: (store) => store.activeRoom?.uuid,
    }),
    lastMessage() {
      const { newMessages, room } = this;
      return (
        newMessages?.[newMessages.length - 1]?.text || room?.last_message || ''
      );
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
      return this.$i18n.locale;
    },
  },

  watch: {
    selected(newSelected) {
      this.checkboxValue = newSelected;
    },
    checkboxValue(newCheckboxValue) {
      this.$emit('update-selected', newCheckboxValue);
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

  unmounted() {
    clearInterval(this.timer);
  },
};
</script>

<style lang="scss" scoped>
.room-card__container {
  display: grid;
  align-items: center;

  &--with-selection {
    grid-template-columns: auto 1fr;
  }
}
.room-card {
  &__checkbox {
    padding: $unnnic-spacing-nano;
  }
}
</style>
