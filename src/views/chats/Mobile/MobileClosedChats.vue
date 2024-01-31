<template>
  <section class="mobile-closed-chats">
    <unnnic-chats-header
      :back="roomBack"
      :title="$t('chats.closed_chats.history')"
      :subtitle="headerSubtitle"
      :close="closeHistory"
      avatarIcon="history"
      size="small"
    />

    <closed-chats-rooms-table v-if="!room" :project="project" @open-room="handleRoom" />
    <room-messages v-else />
  </section>
</template>

<script>
import { mapState } from 'vuex';

import ProjectApi from '@/services/api/resources/settings/project';

import ClosedChatsRoomsTable from '@/views/chats/ClosedChats/RoomsTable';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';

export default {
  name: 'MobileClosedChats',

  components: {
    ClosedChatsRoomsTable,
    RoomMessages,
  },

  data() {
    return {
      isLoadingHeader: false,

      project: null,
    };
  },

  async created() {
    this.resetRoom();
    this.getProjectInfo();
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
}
</style>
