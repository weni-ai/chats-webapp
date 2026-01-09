<template>
  <div class="closed-chats">
    <ClosedChatsHeaderLoading
      v-if="isLoadingHeader"
      data-testid="closed-chats-header-loading"
    />
    <header v-if="!isLoadingHeader && project">
      <UnnnicChatsHeader
        class="closed-chats__header"
        :title="project.name"
        :subtitle="$t('chats.closed_chats.project_history')"
        avatarIcon="history"
        :crumbs="crumbs"
        :close="backToHome"
        :size="closedChatsHeaderSize"
        @crumb-click="handlerCrumbClick"
      />
      <ChatHeaderLoading
        v-show="roomId && isLoadingSelectedRoom"
        data-testid="chat-header-loading"
      />
      <UnnnicChatsHeader
        v-show="!isLoadingSelectedRoom"
        v-if="selectedRoom"
        :title="contactName || `[${$t('unnamed_contact')}]`"
        :avatarName="contactName || '-'"
      />
    </header>
    <main>
      <section
        v-show="roomId"
        class="closed-chats__selected-chat"
        data-testid="closed-chats-selected-chat"
      >
        <section class="closed-chats__selected-chat__content">
          <RoomMessages
            showRoomSummary
            data-testid="room-messages"
          />
        </section>
        <ContactInfo
          isHistory
          :closedRoom="selectedRoom"
          data-testid="contact-info"
        />
      </section>

      <ClosedChatsRoomsTable
        v-show="!roomId"
        data-testid="closed-chats-rooms-table"
      />
    </main>
  </div>
</template>

<script>
import isMobile from 'is-mobile';

import { mapActions, mapState, mapWritableState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';
import History from '@/services/api/resources/chats/history';

import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';
import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ClosedChatsRoomsTable from './RoomsTable.vue';
import { useFeatureFlag } from '@/store/modules/featureFlag';

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
    from: {
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

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useRoomMessages, ['roomMessagesNext']),
    ...mapWritableState(useRooms, ['activeRoomSummary']),
    ...mapState(useFeatureFlag, ['featureFlags']),
    closedChatsHeaderSize() {
      return this.isMobile ? 'small' : 'large';
    },
    contactName() {
      return this.selectedRoom?.contact?.name?.trim() || '';
    },
  },

  watch: {
    roomId: {
      immediate: true,
      async handler(roomId) {
        this.activeRoomSummary.summary = '';
        this.activeRoomSummary.feedback.liked = null;
        if (!roomId) {
          this.setActiveRoom(null);
          this.resetRoomMessages();
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
          this.setActiveRoom(this.selectedRoom);
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

  async created() {
    this.crumbs.push({
      name: this.$t('chats.closed_chats.history'),
      path: 'closed-rooms',
    });
  },

  methods: {
    ...mapActions(useRooms, ['setActiveRoom']),
    ...mapActions(useRoomMessages, ['getRoomMessages', 'resetRoomMessages']),

    backToHome() {
      const from = this.from || this.$route.query.from;
      if (from) this.$router.push({ name: 'room', params: { roomId: from } });
      else this.$router.push({ name: 'home' });
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
      }
    },

    async getHistoryContactRoomMessages() {
      await this.getRoomMessages();
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

  &__header {
    :deep(.unnnic-chats-header__infos) {
      > div > div.unnnic-avatar-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: $unnnic-space-12;
        height: $unnnic-space-12;
        > .unnnic-icon {
          font-size: $unnnic-space-8;
        }
      }
    }
  }

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

    &__content {
      :deep(.chat-summary) {
        margin-left: -$unnnic-space-4;
      }
    }
  }
}
</style>
