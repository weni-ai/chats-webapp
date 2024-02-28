<template>
  <section class="mobile-closed-chats">
    <unnnic-chats-header
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

    <closed-chats-rooms-table v-if="!room" :project="project" @open-room="handleRoom" />
    <section class="mobile-closed-chats__room" v-else>
      <contact-info
        v-if="showRoomInfos"
        isHistory
        :closedRoom="room"
        @close="handleShowRoomInfos"
      />
      <room-messages v-else />
    </section>
  </section>
</template>

<script>
import { mapState } from 'vuex';

import ProjectApi from '@/services/api/resources/settings/project';
import History from '@/services/api/resources/chats/history';

import ClosedChatsRoomsTable from '@/views/chats/ClosedChats/RoomsTable';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import ContactInfo from '@/components/chats/ContactInfo';

export default {
  name: 'MobileClosedChats',

  components: {
    ClosedChatsRoomsTable,
    RoomMessages,
    ContactInfo,
  },

  data() {
    return {
      isLoadingHeader: false,

      project: null,
      showRoomInfos: false,
    };
  },

  async created() {
    this.resetRoom();
    this.getProjectInfo();
  },
  async beforeDestroy() {
    this.resetRoom();
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),

    headerSubtitle() {
      return this.room?.contact ? this.room.contact.name : this.project?.name;
    },

    roomBack() {
      return this.room?.uuid ? () => this.resetRoom() : null;
    },
    roomHeaderClick() {
      return this.room?.uuid ? () => this.handleShowRoomInfos() : null;
    },
  },

  methods: {
    async getProjectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },

    emitClose() {
      this.$emit('close');
    },

    async handleRoom(room) {
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },

    resetRoom() {
      this.handleRoom(null);
    },

    closeHistory() {
      this.resetRoom();
      this.emitClose();
    },

    handleShowRoomInfos() {
      this.showRoomInfos = !this.showRoomInfos;
    },
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomId) {
        if (roomId) {
          const responseRoom = await History.getHistoryContactRoom({ room: roomId });

          const STATUS_NOT_FOUND = 404;
          if (responseRoom.status === STATUS_NOT_FOUND) {
            return;
          }

          this.handleRoom(responseRoom);
        }
      },
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
