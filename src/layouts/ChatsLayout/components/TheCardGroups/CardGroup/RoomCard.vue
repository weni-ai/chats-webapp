<template>
  <section
    class="room-card__container"
    :class="{
      'room-card__container--with-selection': withSelection,
      'room-card__container--selected': room.uuid === activeRoomId && active,
      'room-card__container--hover': hover,
    }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <UnnnicCheckbox
      v-if="withSelection"
      :modelValue="checkboxValue"
      size="sm"
      class="room-card__checkbox"
      @change="checkboxValue = $event"
    />
    <UnnnicChatsContact
      :class="{
        'room-card__contact': true,
        'room-card__contact--selected': room.uuid === activeRoomId && active,
        'room-card__contact--hover': hover,
      }"
      :title="formattedContactName"
      :lastMessage="hideContactMessageInfo ? '' : room.last_message"
      :waitingTime="waitingTimeComputed"
      :unreadMessages="unreadMessages"
      :tabindex="0"
      :selected="room.uuid === activeRoomId && active"
      :locale="locale"
      :lastInteractionTime="room.last_interaction"
      :projectName="room.config?.name"
      @click="$emit('click')"
      @keypress.enter="$emit('click')"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { formatContactName } from '@/utils/chats';

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
    roomType: {
      type: String,
      default: '',
    },
  },
  emits: ['click', 'update-selected'],

  data: () => ({
    formatContactName,
    waitingTime: 0,
    timer: null,
    checkboxValue: false,
    hover: false,
  }),

  computed: {
    ...mapState(useConfig, ['enableAutomaticRoomRouting']),
    ...mapState(useRooms, {
      newMessages(store) {
        return store.newMessagesByRoom[this.room.uuid]?.messages;
      },
      activeRoomId: (store) => store.activeRoom?.uuid,
    }),
    hideContactMessageInfo() {
      return this.roomType === 'waiting' && this.enableAutomaticRoomRouting;
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
    formattedContactName() {
      return formatContactName(this.room);
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

  :deep(.room-card__contact) {
    border: none;
  }

  :deep(.room-card__contact:active) {
    border: none;
  }

  :deep(.room-card__contact--selected) {
    border: none !important;
  }

  &--hover {
    background-color: $unnnic-color-neutral-lightest !important;

    :deep(.room-card__contact) {
      background-color: $unnnic-color-neutral-lightest !important;
    }
  }

  &--with-selection {
    grid-template-columns: auto 1fr;
  }

  .room-card__contact--selected {
    :deep(.chats-contact__infos__unread-messages-container) {
      justify-content: flex-start;
      margin-top: $unnnic-spacing-nano;
    }
  }
}

.room-card {
  &__checkbox {
    padding: $unnnic-spacing-nano $unnnic-spacing-nano $unnnic-spacing-nano
      $unnnic-spacing-ant;
  }
}
</style>
