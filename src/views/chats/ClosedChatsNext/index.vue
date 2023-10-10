<template>
  <closed-chats-header-loading v-if="isLoadingHeader" />
  <div class="closed-chats" v-else>
    <header v-if="project">
      <unnnic-chats-header
        :title="project.name"
        :subtitle="$t('chats.closed_chats.project_history')"
        avatarIcon="task-list-clock-1"
        :crumbs="crumbs"
        :close="backToHome"
      />
      <room-header-loading v-show="roomId && isLoadingSelectedRoom" />
      <unnnic-chats-header
        v-if="!isLoadingSelectedRoom && selectedRoom"
        :title="selectedRoom.contact.name"
        :avatarName="selectedRoom.contact.name"
        :close="() => $router.push({ name: 'closed-rooms' })"
      />
    </header>
    <main>
      <section v-if="roomId" class="closed-chats__selected-chat">
        <room-loading v-show="isLoadingSelectedRoom" only-messages />
        <div v-show="!isLoadingSelectedRoom && selectedRoom">chatMessages</div>
        <contact-info is-history :contact="selectedRoom" @close="() => {}" />
      </section>

      <closed-chats-rooms-table v-else :project="project" />
    </main>
  </div>
</template>

<script>
import ProjectApi from '@/services/api/resources/settings/project';
import History from '@/services/api/resources/chats/history';
import Message from '@/services/api/resources/chats/message';

import ContactInfo from '@/components/chats/ContactInfo';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';
import RoomHeaderLoading from '@/views/loadings/RoomHeader.vue';
import RoomLoading from '@/views/loadings/Room.vue';
import ClosedChatsRoomsTable from './RoomsTable';

export default {
  name: 'ClosedChatsNext',

  components: {
    ClosedChatsHeaderLoading,
    RoomHeaderLoading,
    RoomLoading,
    ContactInfo,
    ClosedChatsRoomsTable,
    // TagGroup,
  },

  props: {
    roomId: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    isLoadingHeader: true,
    isLoadingSelectedRoom: false,

    crumbs: [
      {
        name: 'Chats',
        path: 'home',
      },
    ],
    project: null,
  }),

  created() {
    this.projectInfo();
    this.crumbs.push({
      name: this.$t('chats.closed_chats.history'),
      path: 'closed-rooms',
    });
  },

  methods: {
    backToHome() {
      this.$router.push({ name: 'home' });
    },

    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },
  },

  watch: {
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (roomId) {
          this.isLoadingSelectedRoom = true;

          this.crumbs.push({
            name: 'Nome do usuário',
            path: 'closed-rooms/:roomId',
          });
          const responseRoom = await History.getHistoryContactRoom({ room: roomId });
          const responseRoomMessages = await Message.getByContact(roomId, 0, 20);
          console.log(responseRoomMessages);
          this.selectedRoom = responseRoom;
          // this.selectedRoomMessages = responseRoomMessages;

          this.isLoadingSelectedRoom = false;
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.closed-chats {
  display: flex;
  flex-direction: column;

  height: 100vh;
  width: 100vw;

  overflow: hidden;

  main {
    height: 100%;
    overflow: hidden;
  }

  &__selected-chat {
    display: grid;
    grid-template-columns: 9fr 3fr;

    :deep(.unnnic-chats-header) {
      display: none;
    }
  }
}
</style>
