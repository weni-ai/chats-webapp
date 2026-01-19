<template>
  <div class="closed-chats">
    <ClosedChatsHeaderLoading
      v-if="isLoadingHeader"
      data-testid="closed-chats-header-loading"
    />
    <section
      v-if="selectedRoom && !isLoadingHeader"
      class="closed-chats__header"
    >
      <UnnnicIcon
        icon="arrow-left-1-1"
        size="ant"
        clickable
        @click="backToClosedRooms"
      />
      <p class="closed-chats__header__title">
        {{ contactName || `[${$t('unnamed_contact')}]` }}
      </p>
    </section>
    <UnnnicChatsHeader
      v-if="project && !selectedRoom"
      class="closed-chats__table-header"
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
    <section
      v-if="roomId"
      class="closed-chats__room"
    >
      <section class="closed-chats__room__container">
        <ContactHeader
          v-show="!isLoadingSelectedRoom"
          v-if="selectedRoom"
          :contactName="contactName"
        >
          <template #actions>
            <UnnnicToolTip
              enabled
              :text="$t('chats.search_messages.title')"
              side="left"
            >
              <section
                class="contact-header__search-messages-icon"
                :class="{
                  'contact-header__search-messages-icon--open':
                    showSearchMessagesDrawer,
                }"
              >
                <UnnnicIcon
                  icon="search"
                  clickable
                  scheme="gray-900"
                  size="ant"
                  @click="showSearchMessagesDrawer = !showSearchMessagesDrawer"
                />
              </section>
            </UnnnicToolTip>
          </template>
        </ContactHeader>
        <section class="closed-chats__room__messages">
          <RoomMessages
            class="closed-chats__room__messages__content"
            showRoomSummary
            data-testid="room-messages"
          />
        </section>
      </section>
      <section class="closed-chats__room__info">
        <SearchMessages
          v-if="showSearchMessagesDrawer"
          @close="showSearchMessagesDrawer = false"
        />
        <ContactInfo
          v-else
          isHistory
          :closedRoom="selectedRoom"
          data-testid="contact-info"
        />
      </section>
    </section>
    <section
      v-show="!roomId"
      class="closed-chats__rooms-table"
    >
      <ClosedChatsRoomsTable data-testid="closed-chats-rooms-table" />
    </section>
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
import ContactHeader from '@/components/chats/ContactHeader.vue';
import SearchMessages from '@/components/chats/SearchMessages/index.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';

export default {
  name: 'ClosedChats',

  components: {
    ClosedChatsHeaderLoading,
    ChatHeaderLoading,
    ContactInfo,
    ClosedChatsRoomsTable,
    RoomMessages,
    ContactHeader,
    SearchMessages,
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
    showSearchMessagesDrawer: false,
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

    backToClosedRooms() {
      this.selectedRoom = null;
      this.$router.push({ name: 'closed-rooms' });
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
.contact-header {
  &__search-messages-icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $unnnic-radius-2;

    &--open {
      background-color: rgba(136, 147, 168, 0.2);
    }
  }
}
.closed-chats {
  display: flex;
  flex-direction: column;

  gap: $unnnic-space-4;
  padding: $unnnic-space-4 $unnnic-space-4 0 $unnnic-space-4;

  height: 100vh;
  width: 100vw;

  overflow: hidden;

  &__table-header {
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

  &__rooms-table {
    height: 100%;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $unnnic-space-4;
    padding: $unnnic-space-2 0 $unnnic-space-6 0;

    border-bottom: 1px solid $unnnic-color-border-soft;

    &__title {
      font: $unnnic-font-display-1;
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__room {
    display: grid;
    grid-template-columns: 9fr 3fr;
    grid-template-rows: 100%;
    border-radius: $unnnic-radius-2 $unnnic-radius-2 0 0;
    border: 1px solid $unnnic-color-border-soft;
    padding: 0;
    overflow: hidden;
    height: 90%;

    &__info {
      border-left: 1px solid $unnnic-color-border-soft;
    }

    &__messages {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: hidden;
      background: rgba(253, 245, 233, 0.25);

      :deep(.chat-messages) {
        padding: 0 $unnnic-space-4 0 $unnnic-space-4;
      }
    }

    &__container {
      display: flex;
      flex-direction: column;
      height: 100%;
      &__header {
        border-bottom: 1px solid $unnnic-color-border-soft;
      }
    }
  }
}
</style>
