<template>
  <section
    class="room-card__container"
    :class="{
      'room-card__container--with-selection': withSelection,
      'room-card__container--selected': room.uuid === activeRoomId && active,
      'room-card__container--hover': hover,
    }"
    data-testid="room-card-container"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <UnnnicToolTip
      v-if="withSelection"
      enabled
      :text="checkboxValue ? $t('deselect_this_chat') : $t('select_this_chat')"
      side="right"
    >
      <UnnnicCheckbox
        :modelValue="checkboxValue"
        size="sm"
        class="room-card__checkbox"
        data-testid="room-card-checkbox"
        @change="checkboxValue = $event"
      />
    </UnnnicToolTip>
    <UnnnicChatsContact
      :class="{
        'room-card__contact': true,
        'room-card__contact--selected': room.uuid === activeRoomId && active,
        'room-card__contact--hover': hover,
      }"
      :title="formattedContactName"
      :lastMessage="room.last_message"
      :waitingTime="waitingTimeComputed"
      :unreadMessages="unreadMessages"
      :forceShowUnreadMessages="forceShowUnreadMessages && !!unreadMessages"
      :tabindex="0"
      :activePin="isProgressRoom ? true : false"
      :pinned="isProgressRoom ? room.is_pinned : false"
      :schemePin="handleSchemePin"
      :selected="room.uuid === activeRoomId && active"
      :locale="locale"
      :lastInteractionTime="lastInteractionTime"
      :lastInteractionTimePrefix="lastInteractionTimePrefix"
      :projectName="room.config?.name"
      data-testid="room-card-contact"
      @click="$emit('click')"
      @click-pin="$emit('clickPin', $event)"
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
    forceShowUnreadMessages: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click', 'update-selected', 'clickPin'],

  data: () => ({
    formatContactName,
    waitingTime: 0,
    timer: null,
    checkboxValue: false,
    hover: false,
  }),

  computed: {
    ...mapState(useRooms, {
      newMessages(store) {
        return store.newMessagesByRoom[this.room.uuid]?.messages;
      },
      activeRoomId: (store) => store.activeRoom?.uuid,
      rooms: 'agentRooms',
      maxPinLimit: 'maxPinLimit',
    }),
    ...mapState(useConfig, {
      enableAutomaticRoomRouting: 'enableAutomaticRoomRouting',
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
      return this.$i18n.locale?.toLowerCase();
    },
    formattedContactName() {
      return formatContactName(this.room);
    },
    totalPinnedRooms() {
      return this.rooms.filter((room) => room.is_pinned).length || 0;
    },
    handleSchemePin() {
      if (this.totalPinnedRooms === this.maxPinLimit && !this.room.is_pinned) {
        return 'neutral-cleanest';
      }
      return 'neutral-cloudy';
    },
    isProgressRoom() {
      return this.roomType === 'in_progress';
    },
    lastInteractionTime() {
      return this.roomType === 'waiting'
        ? this.room.added_to_queue_at
        : this.room.last_interaction;
    },
    lastInteractionTimePrefix() {
      return this.roomType === 'waiting' ? this.$t('since') : '';
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
