<template>
  <UnnnicCollapse
    active
    size="md"
  >
    <template #header>
      <label class="card-group__header">
        <section @click.stop>
          <UnnnicCheckbox
            v-if="withSelection"
            class="card-group__checkbox"
            size="sm"
            v-model="collapseCheckboxValue"
            @change="updateSelectAllRooms($event)"
          />
        </section>
        {{ label }}
      </label>
    </template>
    <template v-if="rooms">
      <RoomCard
        v-for="room in rooms"
        :key="room.uuid"
        :room="room"
        @click="open(room)"
        :active="!activeDiscussionId"
        :selected="getIsRoomSelected(room.uuid)"
        @update-selected="updateIsRoomSelected(room.uuid, $event)"
        :withSelection="withSelection"
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
import { mapActions, mapState } from 'vuex';
import RoomCard from './RoomCard';

export default {
  name: 'CardGroup',

  components: {
    RoomCard,
  },

  props: {
    rooms: {
      type: Array,
    },
    discussions: {
      type: Array,
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

  data() {
    return {
      isCollapseOpened: true,
      collapseCheckboxValue: false,
    };
  },

  created() {
    if (!this.rooms && !this.discussions) {
      throw new Error('Pass rooms and discussions as a prop!');
    }
  },

  computed: {
    ...mapState({
      newMessagesByDiscussion(state) {
        return state.chats.discussions.newMessagesByDiscussion;
      },
      activeDiscussionId: (state) =>
        state.chats.discussions.activeDiscussion?.uuid,
      selectedRoomsToTransfer: (state) =>
        state.chats.rooms.selectedRoomsToTransfer,
    }),
  },

  methods: {
    ...mapActions({
      setSelectedRoomsToTransfer: 'chats/rooms/setSelectedRoomsToTransfer',
    }),
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
      if (select) {
        const roomsUuids = this.rooms.map((selectedRoom) => selectedRoom.uuid);
        this.setSelectedRoomsToTransfer(roomsUuids);
      } else {
        this.setSelectedRoomsToTransfer([]);
      }
    },
  },

  watch: {
    selectedRoomsToTransfer(newSelectedRooms) {
      this.collapseCheckboxValue = newSelectedRooms.length >= 1;
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
      svg .primary {
        fill: $unnnic-color-weni-500 !important;
      }
    }
  }
}
</style>
