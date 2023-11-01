<template>
  <div>
    <chats-layout v-if="viewedAgent.email" :viewed-agent="this.viewedAgent.email">
      <view-mode-header :viewedAgent="viewedAgent.name" />

      <room-loading v-show="isRoomSkeletonActive" />
      <chats-background v-if="!room && !isRoomSkeletonActive" />
      <template v-if="!!room && room.uuid && !isRoomSkeletonActive">
        <section class="view-mode__active-chat">
          <unnnic-chats-header
            :title="room.contact.name || ''"
            :avatarClick="() => handleModal('ContactInfo', 'open')"
            :titleClick="() => handleModal('ContactInfo', 'open')"
            :avatarName="room.contact.name"
            :close="() => {}"
          />
          <chat-messages
            :room="room"
            :messages="messages"
            class="messages"
            @show-contact-info="handleModal('ContactInfo', 'open')"
            @scrollTop="searchForMoreMessages"
          />
          <unnnic-button
            v-if="room.user?.email !== me.email"
            class="assume-chat"
            :text="$t('dashboard.view-mode.assume_chat')"
            type="secondary"
            @click="handleModal('AssumeChatConfirmation', 'open')"
          />
        </section>
      </template>

      <modal-get-chat
        :showModal="isAssumeChatConfirmationOpened"
        @closeModal="handleModal('AssumeChatConfirmation', 'close')"
        :title="$t('dashboard.view-mode.assume_chat_question')"
        :description="
          $t('dashboard.view-mode.assume_chat_confirmation', { agent: viewedAgent.name })
        "
        :whenGetChat="whenGetChat"
      />

      <template #aside>
        <contact-info
          v-if="isContactInfoOpened"
          class="contact-info"
          isViewMode
          @close="handleModal('ContactInfo', 'close')"
        />
      </template>
    </chats-layout>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import ChatsLayout from '@/layouts/ChatsLayout';
import RoomLoading from '@/views/loadings/Room.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';
import ContactInfo from '@/components/chats/ContactInfo';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';

import ViewModeHeader from './components/ViewModeHeader';

export default {
  name: 'ViewMode',

  components: {
    ChatsBackground,
    ChatsLayout,
    ContactInfo,
    ChatMessages,
    ViewModeHeader,
    ModalGetChat,
    RoomLoading,
  },

  data: () => ({
    isRoomSkeletonActive: false,
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
    chatPage: 0,
    chatLimit: 20,
  }),

  beforeMount() {
    this.$store.dispatch('chats/rooms/setActiveRoom', '');
  },

  mounted() {
    this.$store.dispatch('dashboard/getViewedAgentData', this.$route.params.viewedAgent);
  },

  beforeDestroy() {
    this.$store.dispatch('dashboard/setViewedAgent', { name: '', email: '' });
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
      roomMessagesNext: (state) => state.chats.roomMessages.roomMessagesNext,
    }),
  },

  methods: {
    async getRoomMessages(concat = false) {
      try {
        await this.$store.dispatch('chats/roomMessages/getRoomMessages', {
          offset: this.chatPage * this.chatLimit,
          concat,
          limit: this.chatLimit,
        });
      } catch (error) {
        console.log(error);
      }
    },
    searchForMoreMessages() {
      if (this.roomMessagesNext) {
        this.chatPage += 1;
        this.getRoomMessages(true);
      }
    },
    resetRoomMessagesParams() {
      this.chatPage = 0;
      this.chatLimit = 20;
    },
    handleModal(modalName, action) {
      const registeredModals = ['ContactInfo', 'AssumeChatConfirmation'];

      if (!registeredModals.includes(modalName)) {
        throw new Error(`Modal name '${modalName}' not found`);
      }

      const modalActionKey = `is${modalName}Opened`;

      const actionMap = {
        open: () => {
          this[modalActionKey] = true;
        },
        close: () => {
          this[modalActionKey] = false;
        },
      };

      if (!actionMap[action]) {
        throw new Error(`Modal handler '${action}' not found`);
      }

      actionMap[action]();
    },
    whenGetChat() {
      this.$router.push({ name: 'room', params: { roomId: this.room.uuid } });
    },
  },

  watch: {
    async room() {
      this.resetRoomMessagesParams();
      this.isContactInfoOpened = false;

      if (this.room?.uuid) {
        this.isRoomSkeletonActive = true;
        await this.getRoomMessages();
        this.isRoomSkeletonActive = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.view-mode {
  &__active-chat {
    display: grid;
    grid-template-rows: auto 1fr auto;

    height: 100%;

    padding-bottom: $unnnic-spacing-sm;

    .chat-messages {
      padding-left: $unnnic-spacing-sm;
    }

    :deep(.unnnic-chats-header) {
      .unnnic-button-close {
        display: none;
      }
    }
  }

  .assume-chat {
    margin: $unnnic-spacing-nano $unnnic-spacing-inline-sm 0;
  }
}
</style>
