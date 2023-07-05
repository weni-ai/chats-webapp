<template>
  <div class="view-mode__container">
    <view-mode-header :viewedAgent="viewedAgent.name" />
    <main class="view-mode__main unnnic-grid-giant">
      <the-room-list
        v-if="viewedAgent.email"
        class="room-list__container unnnic-grid-span-3"
        isViewMode
        :viewedAgent="this.viewedAgent.email"
      />

      <section
        v-if="!!room"
        :class="['chat', `unnnic-grid-span-${isContactInfoOpened ? '6' : '9'}`]"
      >
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

      <chats-background v-else class="unnnic-grid-span-9" />

      <contact-info
        v-if="isContactInfoOpened"
        class="unnnic-grid-span-3 contact-info"
        isViewMode
        @close="handleModal('ContactInfo', 'close')"
      />
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
      this.getRoomMessages();
    },
  },
};
</script>

<style lang="scss" scoped>
$mainHeight: calc(100vh - 40px);

.view-mode {
  &__container {
    height: 100vh;
  }

  &__main {
    padding: 0;
    overflow-y: hidden;

    .room-list__container {
      height: $mainHeight;

      display: flex;
      flex-direction: column;
      padding-left: 0.6rem;
    }

    .chat {
      height: $mainHeight;

      display: flex;
      flex-direction: column;

      padding: {
        bottom: $unnnic-spacing-inset-sm;
        left: $unnnic-spacing-inset-md;
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
    }
  }
}
</style>
