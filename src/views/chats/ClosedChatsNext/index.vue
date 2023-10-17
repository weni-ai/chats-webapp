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
        :close="closeSelectedRoom"
      />
    </header>
    <main>
      <section v-if="roomId" class="closed-chats__selected-chat">
        <room-loading v-show="isLoadingSelectedRoom" only-messages />
        <chat-messages
          v-if="selectedRoom"
          v-show="!isLoadingSelectedRoom"
          :room="selectedRoom"
          :rooms="selectedRoomsUuids"
          @scrollTop="testeDoScroll"
        />
        <contact-info is-history :closed-room="selectedRoom" @close="() => {}" />
      </section>

      <closed-chats-rooms-table v-else :project="project" />
    </main>
  </div>
</template>

<script>
import ProjectApi from '@/services/api/resources/settings/project';
import History from '@/services/api/resources/chats/history';

import ChatMessages from '@/components/chats/chat/ChatMessagesNext';
import ContactInfo from '@/components/chats/ContactInfo';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';
import RoomHeaderLoading from '@/views/loadings/RoomHeader.vue';
import RoomLoading from '@/views/loadings/Room.vue';
import { mapState } from 'vuex';
import ClosedChatsRoomsTable from './RoomsTable';

export default {
  name: 'ClosedChatsNext',

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

    console.log(this.roomId);
    if (this.roomId) {
      this.isLoadingSelectedRoom = true;

      const responseRoom = await History.getHistoryContactRoom({ room: this.roomId });
      this.crumbs.push({
        name: responseRoom.contact.name,
        path: 'closed-rooms/:roomId',
      });
      this.selectedRoom = responseRoom;
      console.log('responseRoom', responseRoom);
      await this.$store.dispatch('rooms/setActiveRoom', this.selectedRoom);
      await this.getHistoryContactRoomMessages();
      const responseRoomUuids = await History.getHistoryContactRoomsUuids({
        external_id: responseRoom.contact.external_id,
      });
      this.selectedRoomsUuids = responseRoomUuids.results;

      this.isLoadingSelectedRoom = false;
    }
  },

  computed: {
    ...mapState({
      roomMessagesNext: (state) => state.roomMessages.roomMessagesNext,
    }),
  },

  methods: {
    backToHome() {
      this.$router.push({ name: 'home' });
    },

    handlerCrumbClick(crumb) {
      console.log(crumb);
    },

    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },

    closeSelectedRoom() {
      this.selectedRoom = null;
      this.crumbs.pop();

      this.$router.push({ name: 'closed-rooms' });
    },

    async testeDoScroll() {
      console.log('roomMessagesNext', this.roomMessagesNext);
      if (this.roomMessagesNext) {
        this.getHistoryContactRoomMessages();
      } else {
        const roomUuidIndex = this.selectedRoomsUuids?.findIndex(
          (room) => room.uuid === this.roomId,
        );
        console.log('roomUuidIndex', this.selectedRoomsUuids[roomUuidIndex]);
        const previousRoom = this.selectedRoomsUuids[roomUuidIndex - 1];

        console.log('previousRoom', previousRoom.uuid);
        if (previousRoom) {
          console.log(previousRoom);
          const responseRoom = await History.getHistoryContactRoom({ room: previousRoom.uuid });
          await this.$store.dispatch('rooms/setActiveRoom', responseRoom);
          this.getHistoryContactRoomMessages();
          console.log('responseRoom', responseRoom);
          this.selectedRoom = responseRoom;
        }
      }
    },

    async getHistoryContactRoomMessages() {
      await this.$store.dispatch('roomMessages/getRoomMessages', { concat: true });
    },
  },

  // watch: {
  //   roomId: {
  //     async handler(roomId) {
  //       if (roomId) {
  //         await this.$store.dispatch('rooms/setActiveRoom', this.selectedRoom);
  //       }
  //     },
  //   },
  // },
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
