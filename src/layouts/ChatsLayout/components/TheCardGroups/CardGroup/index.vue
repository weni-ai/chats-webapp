<template>
  <UnnnicCollapse
    v-model="isCollapseOpened"
    size="md"
  >
    <template #header>
      <label class="card-group__header">
        <section @click.stop>
          <UnnnicCheckbox
            v-if="withSelection"
            v-model="collapseCheckboxValue"
            class="card-group__checkbox"
            size="sm"
            @change="updateSelectAllRooms($event)"
          />
        </section>
        {{ label }}
      </label>
    </template>
    <template v-if="rooms && rooms.length">
      <RoomCard
        v-for="room in rooms"
        :key="room.uuid"
        :room="room"
        :active="!activeDiscussionId"
        :selected="getIsRoomSelected(room.uuid)"
        :withSelection="withSelection"
        @click="open(room)"
        @update-selected="updateIsRoomSelected(room.uuid, $event)"
      />
    </template>
    <template v-if="discussions">
      <UnnnicChatsContact
        v-for="discussion in discussions"
        :key="discussion.uuid"
        :title="discussion.subject"
        :discussionGoal="discussion.contact"
        :tabindex="0"
        :selected="discussion.uuid === activeDiscussionId"
        :unreadMessages="unreadMessages(discussion.uuid)"
        @click="open(discussion)"
        @keypress.enter="open(discussion)"
      />
    </template>
  </UnnnicCollapse>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

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
    label: {
      type: String,
      default: '',
    },
    withSelection: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['open'],

  data() {
    return {
      isCollapseOpened: true,
      collapseCheckboxValue: false,
    };
  },

  computed: {
    ...mapState(useRooms, ['selectedRoomsToTransfer']),
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
    unreadMessages(discussionId) {
      const { newMessagesByDiscussion } = this;
      return newMessagesByDiscussion?.[discussionId]?.messages?.length || 0;
    },
    getIsRoomSelected(uuid) {
      return !!this.selectedRoomsToTransfer.find(
        (mappedUuid) => mappedUuid === uuid,
      );
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
</style>
