<template>
  <template v-if="rooms && !!rooms.length">
    <section
      class="room-container"
      data-testid="room-container"
    >
      <RoomCard
        v-for="(room, index) in rooms"
        :key="room.uuid"
        :room="room"
        :active="getIsActiveRoom(room)"
        :selected="getIsRoomSelected(room.uuid)"
        :withSelection="withSelection"
        :roomType="roomsType"
        :forceShowUnreadMessages="
          getIsActiveRoom(room) && showScrollToBottomButton
        "
        :class="{
          'room-card': true,
          'room-card--without-border': activeRoomIndex === index - 1,
          'room-card--selected': activeRoom?.uuid === room?.uuid,
        }"
        :data-testid="`room-card-${index}`"
        @click="open(room)"
        @click-pin="handlePin(room, $event)"
        @update-selected="updateIsRoomSelected(room.uuid, $event)"
        @mousedown="activeRoomIndex = index"
        @mouseup="activeRoomIndex = null"
      />
    </section>
  </template>
  <template v-else-if="discussions && !!discussions.length">
    <section
      class="discussion-container"
      data-testid="discussion-container"
    >
      <UnnnicChatsContact
        v-for="(discussion, index) in discussions"
        :key="discussion.uuid"
        :class="{
          'discussion-card': true,
          'discussion-card--without-border':
            activeDiscussionIndex === index - 1,
        }"
        :active="activeDiscussionId"
        :title="discussion.subject"
        :discussionGoal="discussion.contact"
        :tabindex="0"
        :selected="discussion.uuid === activeDiscussionId"
        :unreadMessages="unreadMessages(discussion.uuid)"
        :data-testid="`discussion-card-${index}`"
        @click="open(discussion)"
        @keypress.enter="open(discussion)"
        @mousedown="activeDiscussionIndex = index"
        @mouseup="activeDiscussionIndex = null"
      />
    </section>
  </template>
  <p
    v-else
    class="no-results"
    data-testid="no-results-message"
  >
    {{ $t(`without_chats.${roomsType}`) }}
  </p>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import RoomCard from './RoomCard.vue';

export default {
  name: 'CardGroup',

  components: {
    RoomCard,
  },

  props: {
    rooms: {
      type: Array,
      default: () => [],
    },
    discussions: {
      type: Array,
      default: () => [],
    },
    withSelection: {
      type: Boolean,
      default: false,
    },
    roomsType: {
      type: String,
      default: '',
    },
  },

  emits: ['open', 'pin'],

  data() {
    return {
      isCollapseOpened: true,
      collapseCheckboxValue: false,
      roomHoverIndex: null,
      activeRoomIndex: null,
      activeDiscussionIndex: null,
    };
  },

  computed: {
    ...mapState(useRoomMessages, ['showScrollToBottomButton']),
    ...mapState(useRooms, ['selectedRoomsToTransfer', 'activeRoom']),
    ...mapState(useDiscussions, {
      newMessagesByDiscussion: 'newMessagesByDiscussion',
      activeDiscussionId: (store) => store.activeDiscussion?.uuid,
    }),
  },

  watch: {
    selectedRoomsToTransfer(newSelectedRooms) {
      const hasSelectedRooms = newSelectedRooms.length >= 1;
      const isAllRoomsSelected = newSelectedRooms.length === this.rooms?.length;

      this.collapseCheckboxValue = hasSelectedRooms
        ? isAllRoomsSelected || 'less'
        : false;
    },
  },

  created() {
    if (!this.rooms && !this.discussions) {
      throw new Error('Pass rooms and discussions as a prop!');
    }
  },

  methods: {
    ...mapActions(useRooms, ['setSelectedRoomsToTransfer']),
    open(room) {
      this.$emit('open', room);
    },
    handlePin(room, type) {
      this.$emit('pin', room, type);
    },
    unreadMessages(discussionId) {
      const { newMessagesByDiscussion } = this;
      return newMessagesByDiscussion?.[discussionId]?.messages?.length || 0;
    },
    getIsRoomSelected(uuid) {
      return !!this.selectedRoomsToTransfer.find(
        (mappedUuid) => mappedUuid === uuid,
      );
    },
    getIsActiveRoom(room) {
      return !this.activeDiscussionId && this.activeRoom?.uuid === room?.uuid;
    },
    updateIsRoomSelected(uuid, isSelected) {
      if (isSelected) {
        if (this.getIsRoomSelected(uuid)) return;
        this.setSelectedRoomsToTransfer([
          ...this.selectedRoomsToTransfer,
          uuid,
        ]);
      } else {
        this.setSelectedRoomsToTransfer(
          this.selectedRoomsToTransfer.filter(
            (selectedRoom) => selectedRoom !== uuid,
          ),
        );
      }
    },
    updateSelectAllRooms(select) {
      if (select && this.selectedRoomsToTransfer.length === 0) {
        const roomsUuids = this.rooms.map((room) => room.uuid);
        this.setSelectedRoomsToTransfer(roomsUuids);
      } else {
        this.setSelectedRoomsToTransfer([]);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.room-container {
  &__chats-router-info {
    display: grid;
    margin: $unnnic-spacing-nano 0;
  }
}
.room-card {
  border-top: 1px solid $unnnic-color-neutral-soft;

  &:last-child {
    border-bottom: 1px solid $unnnic-color-neutral-soft;
  }
  &:active {
    border-top: 1px solid $unnnic-color-neutral-cleanest;
    border-bottom: 1px solid $unnnic-color-neutral-cleanest;
  }
  &--without-border {
    border: none;
  }
  &--hover {
    background-color: $unnnic-color-neutral-lightest;
  }

  &--selected {
    background-color: $unnnic-color-neutral-light;
  }
}

.discussion-container {
  :deep(.discussion-card:not(:last-child)) {
    border-top: 1px solid $unnnic-color-neutral-soft;
    border-bottom: none;

    &:active {
      border-top: 1px solid $unnnic-color-neutral-cleanest;
      border-bottom: 1px solid $unnnic-color-neutral-cleanest;
    }
  }

  :deep(.discussion-card:last-child) {
    &:active {
      border-top: 1px solid $unnnic-color-neutral-cleanest;
      border-bottom: 1px solid $unnnic-color-neutral-cleanest;
    }
  }

  :deep(.discussion-card--without-border) {
    border-top: none !important;
  }
}

.card-group {
  &__header {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: flex-start;
    gap: $unnnic-spacing-nano;
  }
  &__checkbox {
    padding: $unnnic-spacing-nano;

    :deep(.unnnic-checkbox) {
      // !important at fill is needed here because the
      // unnnicCollapse header is applying an unwanted style when hovering
      .primary {
        fill: $unnnic-color-brand-weni !important;
      }
    }
  }
}
.no-results {
  font: $unnnic-font-emphasis;
  color: $unnnic-color-fg-emphasized;
  padding: 0 $unnnic-space-5;
  margin-top: $unnnic-space-3;
}
</style>
