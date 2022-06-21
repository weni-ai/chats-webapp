<template>
  <chats-layout>
    <section v-if="!!activeChat" class="active-chat">
      <chat-header
        :chat="activeChat"
        closeButtonTooltip="Encerrar chat"
        @close="isCloseChatModalOpen = true"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
      />
      <chat-messages
        :chat="activeChat"
        class="messages"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
        ref="chatMessages"
      />

      <div class="message-editor">
        <message-editor
          v-if="!activeChat.closed"
          v-model="editorMessage"
          @show-quick-messages="
            componentInAsideSlot = componentInAsideSlot === 'quickMessages' ? '' : 'quickMessages'
          "
          @send="sendMessage"
          @upload="sendFileMessage($event)"
        />
      </div>

      <section v-if="activeChat.closed && !activeChat.tags" class="chat-classifier">
        <chat-classifier v-model="tags" label="Por favor, classifique o atendimento:">
          <template #actions>
            <unnnic-button text="Confirmar" type="secondary" size="small" @click="setChatTags" />
          </template>
        </chat-classifier>
      </section>
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
      <component :is="sidebarComponent.name" v-on="sidebarComponent.listeners" />
    </template>
  </chats-layout>
</template>

<script>
import { mapState } from 'vuex';

import ChatsLayout from '@/layouts/ChatsLayout';

import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ContactInfo from '@/components/chats/ContactInfo';
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

  props: {
    id: {
      type: [String, Number],
      default: '',
    },
  },

  mounted() {
    this.setActiveChat(this.id);
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
    setActiveChat(id) {
      const chat = this.$store.getters['chats/getChatById'](id);

      if (!chat) this.$router.push('/');

      this.$store.commit('chats/setActiveChat', chat);
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
      this.$router.replace('/');
    },
  },

  watch: {
    activeChat(newValue) {
      if (!newValue) this.componentInAsideSlot = '';
    },
    id(id) {
      this.setActiveChat(id);
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: {
    top: $unnnic-spacing-inset-md;
    bottom: $unnnic-spacing-inset-sm;
    left: $unnnic-spacing-inset-md;
  }

  .messages {
    overflow-y: auto;
    padding-right: $unnnic-spacing-inset-sm;
    margin: $unnnic-spacing-inline-sm 0 $unnnic-spacing-inline-sm;
  }

  .chat-classifier {
    margin-left: -$unnnic-spacing-inline-md;
    margin-bottom: -$unnnic-spacing-inline-sm;
  }

  .message-editor {
    margin-right: $unnnic-spacing-inline-sm;
    margin-top: auto;
  }
}
</style>
