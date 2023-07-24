<template>
  <div class="view-mode__container" v-if="viewedAgent.email">
    <view-mode-header :viewedAgent="viewedAgent.name" />
    <main :class="['view-mode__main', isContactInfoOpened && 'has-aside']">
      <the-room-list
        v-if="viewedAgent.email"
        class="room-list__container unnnic-grid-span-3"
        isViewMode
        :viewedAgent="this.viewedAgent.email"
      />

      <template v-if="!!room && room.uuid">
        <section class="chat">
          <chat-header :room="room" @show-contact-info="handleModal('ContactInfo', 'open')" />
          <chat-messages
            :room="room"
            :messages="messages"
            class="messages"
            @show-contact-info="handleModal('ContactInfo', 'open')"
            @scrollTop="searchForMoreMessages"
          />
          <div class="assume-chat__container">
            <unnnic-button
              v-if="room.user?.email !== me.email"
              class="assume-chat"
              :text="$t('dashboard.view-mode.assume_chat')"
              type="secondary"
              @click="handleModal('AssumeChatConfirmation', 'open')"
            />
            <modal-get-chat
              :showModal="isAssumeChatConfirmationOpened"
              @closeModal="handleModal('AssumeChatConfirmation', 'close')"
              :title="$t('dashboard.view-mode.assume_chat_question')"
              :description="
                $t('dashboard.view-mode.assume_chat_confirmation', { agent: viewedAgent.name })
              "
              :whenGetChat="whenGetChat"
            />
          </div>
        </section>

        <contact-info
          v-if="isContactInfoOpened"
          class="contact-info"
          isViewMode
          @close="handleModal('ContactInfo', 'close')"
        />
      </template>

      <chats-background v-else class="view-mode__background" />
    </main>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import TheRoomList from '@/layouts/ChatsLayout/components/TheRoomList';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';
import ChatHeader from '@/components/chats/chat/ChatHeader';
import ContactInfo from '@/components/chats/ContactInfo';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';
import ViewModeHeader from './components/ViewModeHeader';

export default {
  name: 'ViewMode',

  components: {
    TheRoomList,
    ChatsBackground,
    ChatHeader,
    ContactInfo,
    ChatMessages,
    ViewModeHeader,
    ModalGetChat,
  },

  data: () => ({
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
    chatPage: 0,
    chatLimit: 20,
  }),

  beforeMount() {
    this.$store.dispatch('rooms/setActiveRoom', '');
  },

  mounted() {
    this.$store.dispatch('dashboard/getViewedAgentData', this.$route.params.viewedAgent);
  },

  beforeDestroy() {
    this.$store.dispatch('dashboard/setViewedAgent', { name: '', email: '' });
  },

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
      hasNext: (state) => state.rooms.hasNext,
    }),
    ...mapGetters('rooms', {
      messages: 'groupedActiveRoomsMessage',
    }),
  },

  methods: {
    async getRoomMessages(concat = false) {
      try {
        await this.$store.dispatch('rooms/getActiveRoomMessages', {
          offset: this.chatPage * this.chatLimit,
          concat,
          limit: this.chatLimit,
        });
      } catch (error) {
        console.log(error);
      }
    },
    searchForMoreMessages() {
      if (this.hasNext) {
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
      this.$router.push({ name: 'room', params: { id: this.room.uuid } });
    },
  },

  watch: {
    room() {
      this.resetRoomMessagesParams();
      if (this.room?.uuid) {
        this.getRoomMessages();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$mainHeight: calc(100vh - 40px);

.view-mode {
  &__container {
    height: 100vh;

    overflow: hidden;
  }

  &__main {
    height: $mainHeight;
    max-height: $mainHeight;

    overflow-y: hidden;

    padding: 0;

    display: grid;
    grid-template-columns: 2.8fr 9fr;

    &.has-aside {
      grid-template-columns: 2.8fr 6.2fr 2.8fr;
    }

    .room-list__container {
      height: $mainHeight;

      display: flex;
      flex-direction: column;

      padding: $unnnic-spacing-inset-sm;
      padding: {
        right: 0;
        top: 0;
      }

      grid-column: 1;
    }

    .chat {
      height: $mainHeight;

      display: flex;
      flex-direction: column;

      grid-column: 2;

      padding: {
        bottom: $unnnic-spacing-inset-sm;
        left: $unnnic-spacing-inline-sm;
      }

      .messages {
        overflow-y: auto;
        padding-right: $unnnic-spacing-inset-sm;
        margin: $unnnic-spacing-inline-sm 0;
      }

      .assume-chat__container {
        margin: {
          top: auto;
          right: $unnnic-spacing-inline-sm;
        }

        button {
          width: 100%;
        }
      }
    }

    .contact-info {
      border: 1px solid $unnnic-color-neutral-soft;

      overflow-y: auto;

      grid-column: 3;
    }
  }

  &__background {
    grid-column: 2;

    margin-left: $unnnic-spacing-inline-sm;
  }
}
</style>
