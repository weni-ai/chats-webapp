<template>
  <div class="closed-chats">
    <ClosedChatsHeaderLoading v-if="isLoadingHeader" />
    <header v-if="!isLoadingHeader && project">
      <UnnnicChatsHeader
        :title="project.name"
        :subtitle="$t('chats.closed_chats.project_history')"
        avatarIcon="history"
        :crumbs="crumbs"
        :close="backToHome"
        @crumbClick="handlerCrumbClick"
        :size="closedChatsHeaderSize"
      />
      <ChatHeaderLoading v-show="roomId && isLoadingSelectedRoom" />
      <UnnnicChatsHeader
        v-show="!isLoadingSelectedRoom"
        v-if="selectedRoom"
        :title="selectedRoom.contact.name"
        :avatarName="selectedRoom.contact.name"
      />
    </header>
    <main>
      <section
        v-if="roomId"
        class="closed-chats__selected-chat"
      >
        <RoomMessages />
        <ContactInfo
          isHistory
          :closedRoom="selectedRoom"
          @close="() => {}"
        />
      </section>

      <ClosedChatsRoomsTable v-else />
    </main>
  </div>
</template>

<script>
import isMobile from 'is-mobile';

import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';
import History from '@/services/api/resources/chats/history';

import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';
import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ClosedChatsRoomsTable from './RoomsTable.vue';

export default {
  name: 'ClosedChats',

  components: {
    ClosedChatsHeaderLoading,
    ChatHeaderLoading,
    ContactInfo,
    ClosedChatsRoomsTable,
    RoomMessages,
  },

  props: {
    roomId: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    isMobile: isMobile(),

    isLoadingHeader: true,
    isLoadingSelectedRoom: false,

    crumbs: [
      {
        name: 'Chats',
        path: 'home',
      },
    ],

    selectedRoom: null,
    selectedRoomsUuids: null,
  }),

  async created() {
    this.crumbs.push({
      name: this.$t('chats.closed_chats.history'),
      path: 'closed-rooms',
    });
  },

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useRoomMessages, ['roomMessagesNext']),

    closedChatsHeaderSize() {
      return this.isMobile ? 'small' : 'large';
    },
  },

  methods: {
    ...mapActions(useRooms, ['setActiveRoom']),
    ...mapActions(useRoomMessages, ['getRoomMessages', 'resetRoomMessages']),

    backToHome() {
      this.$router.push({ name: 'home' });
    },

    handlerCrumbClick(crumb) {
      if (crumb.name === this.selectedRoom?.contact.name) return;

      this.selectedRoom = null;

      const index = this.crumbs.findIndex((item) => item.path === crumb.path);
      this.crumbs = this.crumbs.slice(0, index + 1);

      this.$router.push({ name: crumb.path });
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
        //   await this.setActiveRoom(responseRoom);
        //   this.getHistoryContactRoomMessages();
        //   this.selectedRoom = responseRoom;
        // }
      }
    },

    async getHistoryContactRoomMessages() {
      await this.getRoomMessages();
    },
  },

  watch: {
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (!roomId) {
          await this.setActiveRoom(null);
          await this.resetRoomMessages();
        }
        if (roomId) {
          this.isLoadingSelectedRoom = true;

          const responseRoom = await History.getHistoryContactRoom({
            room: roomId,
          });

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
          await this.setActiveRoom(this.selectedRoom);
          await this.getHistoryContactRoomMessages();
          const responseRoomUuids = await History.getHistoryContactRoomsUuids({
            external_id: responseRoom.contact.external_id,
          });
          this.selectedRoomsUuids = responseRoomUuids.results;

          this.isLoadingSelectedRoom = false;
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
