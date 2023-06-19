<template>
  <div class="view-mode__container">
    <view-mode-header viewedAgent="Fabricio Santos" />
    <main class="view-mode__main unnnic-grid-giant">
      <the-room-list
        v-if="viewedAgent"
        class="room-list__container unnnic-grid-span-3"
        isViewMode
        :viewedAgent="viewedAgent"
      />

      <section
        v-if="!!room"
        :class="['chat', `unnnic-grid-span-${isContactInfoOpened ? '6' : '9'}`]"
      >
        <chat-header
          :room="room"
          :closeButtonTooltip="$t('chats.end')"
          @show-contact-info="handleModal('ContactInfo', 'open')"
        />
        <chat-messages
          :room="room"
          :messages="messages"
          class="messages"
          @show-contact-info="handleModal('ContactInfo', 'open')"
        />
        <div class="assume-chat__container">
          <unnnic-button
            class="assume-chat"
            :text="$t('dashboard.view-mode.assume_chat')"
            type="secondary"
            @click="handleModal('AssumeChatConfirmation', 'open')"
          />
          <unnnic-modal
            :showModal="isAssumeChatConfirmationOpened"
            @close="handleModal('AssumeChatConfirmation', 'close')"
            :text="$t('dashboard.view-mode.assume_chat_question')"
            :description="
              $t('dashboard.view-mode.assume_chat_confirmation', { agent: 'Fabricio Santos' })
            "
            modal-icon="messages-bubble-1"
            scheme="neutral-darkest"
          />
        </div>
      </section>

      <chats-background v-else class="unnnic-grid-span-9" />

      <contact-info
        v-if="isContactInfoOpened"
        class="unnnic-grid-span-3"
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
  },

  data: () => ({
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
    viewedAgent: '',
  }),

  mounted() {
    this.viewedAgent = this.$route.params.viewedAgent;
  },

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
    }),
    ...mapGetters('rooms', {
      messages: 'groupedActiveRoomsMessage',
    }),
  },

  methods: {
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
  },

  watch: {
    async room() {
      try {
        await this.$store.dispatch('rooms/getActiveRoomMessages', {
          offset: this.page * this.limit,
          concat: false,
          limit: this.limit,
        });
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$mainHeight: calc(100vh - 40px - $unnnic-spacing-inset-md);

.view-mode {
  &__container {
    height: 100vh;
  }

  &__main {
    padding: 0;
    padding-top: $unnnic-spacing-inset-md;
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
  }
}
</style>
