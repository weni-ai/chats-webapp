<template>
  <main-layout>
    <section class="active-chat">
      <chat-header :chat="activeChat" />
      <chat-messages :chat="activeChat" class="messages" />

      <message-editor
        v-model="editorMessage"
        class="message-editor"
        :showing-sidebar="showSidebar"
        @showMacroMessages="
          componentInSidebar = componentInSidebar === 'macroMessages' ? '' : 'macroMessages'
        "
      />
    </section>

    <template #aside>
      <component :is="sidebarComponent.name" v-on="sidebarComponent.listeners" />
    </template>
  </main-layout>
</template>

<script>
import { unnnicIcon } from '@weni/unnnic-system';

import chats from '@/data/chats.json';

import MainLayout from '@/layouts/MainLayout';

import MacroMessagesController from '@/components/chats/MacroMessagesController';
import MessageEditor from '@/components/chats/MessageEditor';
import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';

export default {
  name: 'ActiveChat',

  components: {
    ChatHeader,
    ChatMessages,
    MacroMessagesController,
    MainLayout,
    MessageEditor,
    unnnicIcon,
  },

  data: () => ({
    activeChat: chats[1].chats[1],
    componentInSidebar: '',
    editorMessage: '',
  }),

  computed: {
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
      };
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
</style>
