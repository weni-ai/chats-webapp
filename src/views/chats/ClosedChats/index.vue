<template>
  <div class="closed-chats">
    <closed-chats-header-loading v-if="isLoadingHeader" />
    <header v-if="!isLoadingHeader && project">
      <unnnic-chats-header
        :title="project.name"
        :subtitle="$t('chats.closed_chats.project_history')"
        avatarIcon="task-list-clock-1"
        :crumbs="crumbs"
        :close="backToHome"
        @crumbClick="handlerCrumbClick"
      />
      <room-header-loading v-show="roomId && isLoadingSelectedRoom" />
      <unnnic-chats-header
        v-if="!isLoadingSelectedRoom && selectedRoom"
        :title="selectedRoom.contact.name"
        :avatarName="selectedRoom.contact.name"
      />
    </header>
    <main>
      <section v-if="roomId" class="closed-chats__selected-chat">
        <room-loading v-show="isLoadingSelectedRoom" only-messages />
        <chat-messages
          v-if="selectedRoom"
          v-show="!isLoadingSelectedRoom"
          :room="selectedRoom"
          @scrollTop="chatScrollTop"
        />
        <contact-info v-if="selectedRoom" is-history :closedRoom="selectedRoom" @close="() => {}" />
      </section>

      <closed-chats-rooms-table v-else :project="project" />
    </main>
  </div>
</template>

<script>
import ProjectApi from '@/services/api/resources/settings/project';
import History from '@/services/api/resources/chats/history';

import ChatMessages from '@/components/chats/chat/ChatMessages';
import ContactInfo from '@/components/chats/ContactInfo';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';
import RoomHeaderLoading from '@/views/loadings/RoomHeader.vue';
import RoomLoading from '@/views/loadings/Room.vue';
import { mapState } from 'vuex';
import ClosedChatsRoomsTable from './RoomsTable';

export default {
  name: 'ClosedChats',

  components: {
    ClosedChatsHeaderLoading,
    RoomHeaderLoading,
    RoomLoading,
    ContactInfo,
    ClosedChatsRoomsTable,
    ChatMessages,
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

    selectedRoom: null,
    selectedRoomsUuids: null,
  }),

  async created() {
    this.projectInfo();
    this.crumbs.push({
      name: this.$t('chats.closed_chats.history'),
      path: 'closed-rooms',
    });
  },

  computed: {
    ...mapState({
      roomMessagesNext: (state) => state.chats.roomMessages.roomMessagesNext,
    }),
  },

  methods: {
    backToHome() {
      this.$router.push({ name: 'home' });
    },

    handlerCrumbClick(crumb) {
      if (crumb.name === this.selectedRoom.contact.name) return;

      this.selectedRoom = null;

      const index = this.crumbs.findIndex((item) => item.path === crumb.path);
      this.crumbs = this.crumbs.slice(0, index + 1);

      this.$router.push({ name: crumb.path });
    },

    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },

    async chatScrollTop() {
      if (this.roomMessagesNext) {
        this.getHistoryContactRoomMessages();
      } else {
        // const roomUuidIndex = this.selectedRoomsUuids?.findIndex(
        //   (room) => room.uuid === this.roomId,
        // );
        // const previousRoom = this.selectedRoomsUuids[roomUuidIndex - 1];
        //
        // if (previousRoom) {
        //   const responseRoom = await History.getHistoryContactRoom({ room: previousRoom.uuid });
        //   await this.$store.dispatch('chats/rooms/setActiveRoom', responseRoom);
        //   this.getHistoryContactRoomMessages();
        //   this.selectedRoom = responseRoom;
        // }
      }
    },

    async getHistoryContactRoomMessages() {
      await this.$store.dispatch('chats/roomMessages/getRoomMessages', { concat: true });
    },
  },

  watch: {
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (!roomId) {
          await this.$store.dispatch('chats/rooms/setActiveRoom', null);
          await this.$store.dispatch('chats/roomMessages/resetRoomMessages');
        }
        if (roomId) {
          this.isLoadingSelectedRoom = true;

          const responseRoom = await History.getHistoryContactRoom({ room: roomId });

          const STATUS_NOT_FOUND = 404;
          if (responseRoom.status === STATUS_NOT_FOUND) {
            this.$router.push({ name: 'closed-rooms' });
            return;
          }

          this.crumbs.push({
            name: responseRoom.contact.name,
            path: 'closed-rooms/:roomId',
          });
          this.selectedRoom = responseRoom;
          await this.$store.dispatch('chats/rooms/setActiveRoom', this.selectedRoom);
          await this.getHistoryContactRoomMessages();
          const responseRoomUuids = await History.getHistoryContactRoomsUuids({
            external_id: responseRoom.contact.external_id,
          });
          this.selectedRoomsUuids = responseRoomUuids.results;

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
    grid-template-rows: 100%;

    padding-left: $unnnic-spacing-sm;

    height: 100%;

    background-color: $unnnic-color-background-carpet;

    :deep(.unnnic-chats-header) {
      display: none;
    }
  }
}
</style>
