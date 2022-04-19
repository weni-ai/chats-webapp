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
        ref="chatMessages"
      />

      <message-editor
        v-if="!activeChat.closed"
        v-model="editorMessage"
        class="message-editor"
        @show-quick-messages="
          componentInSidebar = componentInSidebar === 'quickMessages' ? '' : 'quickMessages'
        "
        @send="sendMessage"
      />

      <template v-if="activeChat.closed && !activeChat.tags">
        <div class="chat-closed-message">Atendimento encerrado pelo agente</div>

        <chat-classifier v-model="tags" label="Por favor, classifique o atendimento:">
          <template #actions>
            <unnnic-button text="Confirmar" type="secondary" size="small" @click="setChatTags" />
          </template>
        </chat-classifier>
      </template>
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
import MessageEditor from '@/components/chats/MessageEditor';
import ChatClassifier from '@/components/chats/ChatClassifier';
import QuickMessages from '@/components/chats/QuickMessages';

export default {
  name: 'ActiveChat',

  components: {
    ChatHeader,
    ChatMessages,
    ContactInfo,
    QuickMessages,
    MainLayout,
    MessageEditor,
    ChatClassifier,
  },

  data: () => ({
    componentInSidebar: '',
    editorMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
  }),

  computed: {
    ...mapState({
      activeChat: (store) => store.chats.activeChat,
    }),
    sidebarComponent() {
      return this.sidebarComponents[this.componentInSidebar] || {};
    },
    sidebarComponents() {
      return {
        quickMessages: {
          name: QuickMessages.name,
          listeners: {
            close: () => {
              this.componentInSidebar = '';
            },
            'select-quick-message': (quickMessage) => {
              this.editorMessage = quickMessage.message;
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
      this.$store.commit('chats/setActiveChat', { ...this.activeChat, closed: true });
      this.isCloseChatModalOpen = false;
    },
    scrollMessagesToBottom() {
      this.$refs.chatMessages.$el.scrollTop = this.$refs.chatMessages.$el.scrollHeight;
    },
    async sendMessage() {
      const message = this.editorMessage.trim();

      if (!message) return;

      await this.$store.dispatch('chats/sendMessage', message);

      this.scrollMessagesToBottom();
    },

    getTodayDate() {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(new Date());
    },

    async setChatTags() {
      const { activeChat, tags } = this;

      await this.$store.dispatch('chats/closeChat', {
        id: activeChat.id,
        username: activeChat.username,
        agent: 'Ana',
        date: this.getTodayDate(),
        closed: true,
        tags,
        messages: activeChat.messages,
      });

      this.$store.commit('chats/setActiveChat', null);
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
  padding-right: 1rem;

  .messages {
    overflow-y: auto;
    padding-right: 1.5rem;
    margin: 1rem 0 1rem;
  }

  .message-editor {
    margin-top: auto;
  }

  .chat-closed-message {
    width: 100%;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: $unnnic-color-feedback-yellow;
  }
}

.contact-info {
  overflow-y: auto;
}
</style>
