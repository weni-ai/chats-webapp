<template>
  <main-layout>
    <section v-if="!!activeChat" class="active-chat">
      <chat-header
        :chat="activeChat"
        @close="isCloseChatModalOpen = true"
        @show-contact-info="componentInSidebar = 'contactInfo'"
      />
      <chat-messages
        :chat="activeChat"
        class="messages"
        @show-contact-info="componentInSidebar = 'contactInfo'"
      />

      <message-editor
        v-model="editorMessage"
        class="message-editor"
        :showing-sidebar="showSidebar"
        @show-macro-messages="
          componentInSidebar = componentInSidebar === 'macroMessages' ? '' : 'macroMessages'
        "
      />
    </section>

    <unnnic-modal
      :showModal="isCloseChatModalOpen"
      @close="isCloseChatModalOpen = false"
      title="Encerrar conversa"
      description="Você tem certeza que deseja encerrar a conversa?"
      modal-icon="alert-circle-1"
      scheme="feedback-yellow"
    >
      <template #options>
        <unnnic-button text="Confirmar" type="terciary" @click="closeChat" />
        <unnnic-button text="Cancelar" @click="isCloseChatModalOpen = false" />
      </template>
    </unnnic-modal>

    <template #aside>
      <component
        :is="sidebarComponent.name"
        v-on="sidebarComponent.listeners"
        v-bind="sidebarComponent.attrs"
      />
    </template>
  </main-layout>
</template>

<script>
import { mapState } from 'vuex';

import MainLayout from '@/layouts/MainLayout';

import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ContactInfo from '@/components/ContactInfo';
import MacroMessagesController from '@/components/chats/MacroMessagesController';
import MessageEditor from '@/components/chats/MessageEditor';

export default {
  name: 'ActiveChat',

  components: {
    ChatHeader,
    ChatMessages,
    ContactInfo,
    MacroMessagesController,
    MainLayout,
    MessageEditor,
  },

  data: () => ({
    componentInSidebar: '',
    editorMessage: '',
    isCloseChatModalOpen: false,
  }),

  computed: {
    ...mapState({
      activeChat: (store) => store.chats.activeChat,
    }),

    showSidebar() {
      return !!this.sidebarComponent.name;
    },
    sidebarComponent() {
      return this.sidebarComponents[this.componentInSidebar] || {};
    },
    sidebarComponents() {
      return {
        macroMessages: {
          name: MacroMessagesController.name,
          listeners: {
            close: () => {
              this.componentInSidebar = '';
            },
            'select-macro-message': (macroMessage) => {
              this.editorMessage = macroMessage.message;
            },
          },
        },
        contactInfo: {
          name: ContactInfo.name,
          listeners: {
            close: () => {
              this.componentInSidebar = '';
            },
          },
          attrs: {
            class: 'contact-info',
          },
        },
      };
    },
  },

  methods: {
    closeChat() {
      this.activeChat.closed = true;
      this.isCloseChatModalOpen = false;
    },
  },

  watch: {
    activeChat(newValue) {
      if (!newValue) this.componentInSidebar = '';
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1.5rem;

  .messages {
    overflow-y: auto;
    padding-right: 1.5rem;
    margin: 1.5rem 0 1rem;
  }

  .message-editor {
    margin-top: auto;
  }
}

.contact-info {
  overflow-y: auto;
}
</style>
