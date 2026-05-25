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
      class="room-card__checkbox-tooltip"
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
    <ChatContact
      :class="{
        'room-card__contact': true,
        'room-card__contact--selected': room.uuid === activeRoomId && active,
        'room-card__contact--hover': hover,
      }"
      :title="formattedContactName"
      :lastMessage="displayedLastMessage"
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
      :projectName="handleProjectName"
      :pendingResponse="showPendingResponse"
      :pendingResponseTooltip="
        showPendingResponse ? pendingResponseTooltipText : ''
      "
      :newMessageIndicator="showNewChatReceivedIndicator"
      :newMessageIndicatorTooltip="
        showNewChatReceivedIndicator ? newChatReceivedTooltipText : ''
      "
      data-testid="room-card-contact"
      @click="$emit('click')"
      @click-pin="$emit('clickPin', $event)"
      @keypress.enter="$emit('click')"
    >
      <template #avatar>
        <UnnnicChatsUserAvatar
          :username="formattedContactName"
          :active="hover || (room.uuid === activeRoomId && active)"
          scheme="bg-muted"
          textColor="fg-emphasized"
        />
      </template>
    </ChatContact>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useProfile } from '@/store/modules/profile';

import ChatContact from '@/components/chats/ChatContact.vue';

import { formatContactName } from '@/utils/chats';

const ONE_MINUTE_IN_MILLISECONDS = 60000;

export default {
  name: 'RoomCard',

  components: {
    ChatContact,
  },

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
      project: 'project',
    }),
    ...mapState(useFeatureFlag, {
      featureFlags: 'featureFlags',
    }),
    ...mapState(useProfile, {
      me: 'me',
    }),
    isPendingResponseFeatureEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        'weniChatsPendingResponse',
      );
    },
    isLastMessageFromAgent() {
      return !!this.room.last_message?.user;
    },
    isLastMessageFromContact() {
      return !!this.room.last_message?.contact && !this.room.last_message?.user;
    },
    isLastMessageFromAnotherAgent() {
      const isUserHaveEmail = this.room.last_message?.user?.email;

      const verifyEmail = isUserHaveEmail
        ? this.room.last_message?.user?.email !== this.me?.email
        : this.room.last_message?.user !== this.me?.email;

      return !!this.room.last_message?.user && verifyEmail;
    },
    isLastMessageFromBot() {
      return !this.room.last_message?.contact && !this.room.last_message?.user;
    },
    showPendingResponse() {
      const isLastMessageValid =
        this.isLastMessageFromContact ||
        this.isLastMessageFromAnotherAgent ||
        this.isLastMessageFromBot;

      return (
        !this.showNewChatReceivedIndicator &&
        this.isPendingResponseFeatureEnabled &&
        this.isProgressRoom &&
        isLastMessageValid &&
        this.unreadMessages === 0
      );
    },
    pendingResponseTooltipText() {
      return this.$t('room_card.pending_response.tooltip');
    },
    showNewChatReceivedIndicator() {
      return (
        this.isProgressRoom &&
        !!this.room?.isNewChatReceived &&
        this.unreadMessages === 0
      );
    },
    newChatReceivedTooltipText() {
      return this.$t('room_card.new_chat_received.tooltip');
    },
    displayedLastMessage() {
      const { last_message: lastMessage } = this.room;

      const isFromMe =
        this.isPendingResponseFeatureEnabled &&
        this.isProgressRoom &&
        this.isLastMessageFromAgent &&
        lastMessage &&
        (lastMessage?.user === this.me?.email ||
          lastMessage?.user?.email === this.me?.email);

      if (!isFromMe) return lastMessage;

      const hasMedia =
        Array.isArray(lastMessage.media) && lastMessage.media.length > 0;

      if (hasMedia) {
        return {
          ...lastMessage,
          isFromUser: true,
        };
      }

      const youPrefix = this.$t('room_card.last_message.you_prefix');
      const originalText = lastMessage.text || '';

      return {
        ...lastMessage,
        isFromUser: true,
        text: originalText ? `${youPrefix}: ${originalText}` : `${youPrefix}: `,
      };
    },
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
        return 'fg-base';
      }
      return 'fg-base';
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
    handleProjectName() {
      const canUseNameSectorInRooms =
        this.project.config?.can_use_name_sector_in_rooms;

      if (canUseNameSectorInRooms) {
        return this.room.queue?.sector_name;
      }
      return null;
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
  background-color: $unnnic-color-bg-base;

  :deep(.room-card__contact) {
    border: none;
    background-color: transparent;
  }

  :deep(.room-card__contact:hover),
  :deep(.room-card__contact.selected),
  :deep(.room-card__contact.selected:hover) {
    background-color: transparent;
  }

  :deep(.room-card__contact:active) {
    border: none;
  }

  :deep(.room-card__contact--selected) {
    border: none !important;
  }

  &--hover {
    background-color: $unnnic-color-bg-base-soft;
  }

  &--with-selection {
    grid-template-columns: auto 1fr;
  }

  &--selected {
    background-color: $unnnic-color-bg-base-soft;
  }

  .room-card__contact--selected {
    :deep(.chats-contact__infos__unread-messages-container) {
      justify-content: flex-start;
      margin-top: $unnnic-spacing-nano;
    }
  }

  :deep(
    .chats-contact__infos__unread-messages-container:has(
        .chats-contact__infos__new-message-indicator
      ):not(:has(.chats-contact__infos__message-time))
  ) {
    justify-content: center;
  }

  :deep(
    .chats-contact:has(.chats-contact__infos__new-message-indicator)
      .chats-contact__infos__additional-information
  ) {
    font-weight: $unnnic-font-weight-bold;
  }
}

.room-card {
  &__checkbox {
    padding: $unnnic-spacing-nano $unnnic-spacing-nano $unnnic-spacing-nano
      $unnnic-spacing-ant;
  }
}
</style>
