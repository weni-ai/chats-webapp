<template>
  <chats-layout>
    <section v-if="!!activeChat" class="active-chat">
      <chat-header
        :chat="activeChat"
        @close="isCloseChatModalOpen = true"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
      />
      <chat-messages
        :chat="activeChat"
        class="messages"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
        ref="chatMessages"
      />

      <message-editor
        v-if="!activeChat.closed"
        v-model="editorMessage"
        class="message-editor"
        @show-quick-messages="
          componentInAsideSlot = componentInAsideSlot === 'quickMessages' ? '' : 'quickMessages'
        "
        @send="sendMessage"
        @upload="sendFileMessage($event)"
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
  </chats-layout>
</template>

<script>
import { mapState } from 'vuex';

import ChatsLayout from '@/layouts/ChatsLayout';

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
    ChatsLayout,
    MessageEditor,
    ChatClassifier,
  },

  data: () => ({
    componentInAsideSlot: '',
    editorMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
  }),

  computed: {
    ...mapState({
      activeChat: (store) => store.chats.activeChat,
    }),
    sidebarComponent() {
      return this.sidebarComponents[this.componentInAsideSlot] || {};
    },
    sidebarComponents() {
      return {
        quickMessages: {
          name: QuickMessages.name,
          listeners: {
            close: () => {
              this.componentInAsideSlot = '';
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
              this.componentInAsideSlot = '';
            },
          },
          attrs: {
            class: 'scrollable',
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
    async sendFileMessage(files) {
      try {
        const filesInBase64 = await Promise.all(files.map((file) => this.fileToBase64(file)));

        await Promise.all(
          filesInBase64.map((file) =>
            this.$store.dispatch('chats/sendMessage', {
              src: file.src,
              type: file.type,
              isMedia: true,
              fileExtension: file.fileExtension,
              filename: file.filename,
            }),
          ),
        );
      } catch (e) {
        console.error('O upload de alguns arquivos pode não ter sido concluído');
      }
    },
    async sendMessage() {
      const message = this.editorMessage.trim();

      if (!message) return;

      await this.$store.dispatch('chats/sendMessage', message);

      this.scrollMessagesToBottom();
    },
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onload = () =>
          resolve({
            filename: file.name.split('.')[0],
            type: this.getFileType(file),
            fileExtension: file.type.split('/')[1],
            src: fr.result,
          });
        fr.onerror = (err) => reject(err);
      });
    },
    getFileType(file) {
      const type = file.type.split('/')[0];
      return type === 'application' ? 'document' : type;
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
      if (!newValue) this.componentInAsideSlot = '';
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: $unnnic-spacing-inset-sm;

  .messages {
    overflow-y: auto;
    padding-right: $unnnic-spacing-inset-md;
    margin: $unnnic-spacing-inline-sm 0 $unnnic-spacing-inline-sm;
  }

  .message-editor {
    margin-top: auto;
  }

  .chat-closed-message {
    width: 100%;
    text-align: center;
    font-size: $unnnic-font-size-body-gt;
    line-height: 1.375rem;
    color: $unnnic-color-feedback-yellow;
  }
}

.scrollable {
  overflow-y: auto;
}
</style>
