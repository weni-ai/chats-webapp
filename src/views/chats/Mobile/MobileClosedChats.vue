<template>
  <section class="mobile-closed-chats">
    <UnnnicChatsHeader
      v-if="!showRoomInfos"
      :back="roomBack"
      :title="$t('chats.closed_chats.history')"
      :subtitle="headerSubtitle"
      :close="closeHistory"
      avatarIcon="history"
      size="small"
      :avatarClick="roomHeaderClick"
      :titleClick="roomHeaderClick"
    />

    <ClosedChatsRoomsTable
      v-if="!room"
      :project="project"
      @open-room="handleRoom"
    />
    <section
      v-else
      class="mobile-closed-chats__room"
    >
      <ContactInfo
        v-if="showRoomInfos"
        isHistory
        :closedRoom="room"
        @close="handleShowRoomInfos"
      />
      <RoomMessages v-else />
    </section>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import History from '@/services/api/resources/chats/history';

import ClosedChatsRoomsTable from '@/views/chats/ClosedChats/RoomsTable.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';

export default {
  name: 'MobileClosedChats',

  components: {
    ClosedChatsRoomsTable,
    RoomMessages,
    ContactInfo,
  },
  emits: ['close'],

  data() {
    return {
      isLoadingHeader: false,

      showRoomInfos: false,
    };
  },

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),

    headerSubtitle() {
      return this.room?.contact ? this.room.contact.name : this.project?.name;
    },

    roomBack() {
      return this.room?.uuid ? () => this.resetChat() : null;
    },
    roomHeaderClick() {
      return this.room?.uuid ? () => this.handleShowRoomInfos() : null;
    },
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomId) {
        if (roomId) {
          const responseRoom = await History.getHistoryContactRoom({
            room: roomId,
          });

          const STATUS_NOT_FOUND = 404;
          if (responseRoom.status === STATUS_NOT_FOUND) {
            return;
          }

          this.handleRoom(responseRoom);
        }
      },
    },
    project: {
      immediate: true,
      handler(newProject) {
        if (newProject) {
          this.isLoadingHeader = false;
        }
      },
    },
  },

  async created() {
    await this.resetChat();
  },
  async beforeUnmount() {
    await this.resetChat();
  },

  methods: {
    ...mapActions(useRooms, ['setActiveRoom']),
    ...mapActions(useDiscussions, ['setActiveDiscussion']),

    emitClose() {
      this.$emit('close');
    },

    async handleRoom(room) {
      await this.setActiveRoom(room);
    },

    async resetChat() {
      this.handleRoom(null);
      await this.setActiveDiscussion(null);
    },

    closeHistory() {
      this.resetChat();
      this.emitClose();
    },

    handleShowRoomInfos() {
      this.showRoomInfos = !this.showRoomInfos;
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-closed-chats {
  display: flex;
  flex-direction: column;

  height: 100%;

  background-color: $unnnic-color-background-lightest;

  :deep(.chat-messages) {
    padding: 0 $unnnic-spacing-ant;
  }

  &__room {
    height: 100%;

    overflow: hidden;
  }
}
</style>
