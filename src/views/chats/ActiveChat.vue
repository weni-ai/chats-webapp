<template>
  <chats-layout>
    <section v-if="!!room" class="active-chat">
      <chat-header
        :room="room"
        :closeButtonTooltip="$t('chats.end')"
        @close="isCloseChatModalOpen = true"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
      />
      <chat-messages
        :room="room"
        :messages="messages"
        class="messages"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
        ref="chatMessages"
      />

      <div v-if="isMessageEditorVisible" class="message-editor">
        <message-editor
          v-model="editorMessage"
          :audio.sync="audioMessage"
          @show-quick-messages="
            componentInAsideSlot = componentInAsideSlot === 'quickMessages' ? '' : 'quickMessages'
          "
          @send-message="sendMessage"
          @send-audio="sendAudio"
          @upload="sendFileMessage($event)"
        />
      </div>

      <div v-if="!room.user" class="get-chat-button-container">
        <unnnic-button
          class="get-chat-button"
          :text="$t('chats.get_chat')"
          type="secondary"
          @click="isGetChatConfirmationModalOpen = true"
        />
      </div>

      <section v-if="isRoomClassifierVisible" class="chat-classifier">
        <chat-classifier v-model="tags" label="Por favor, classifique o atendimento:">
          <template #actions>
            <unnnic-button
              :text="$t('confirm')"
              type="secondary"
              size="small"
              @click="setChatTags"
            />
          </template>
        </chat-classifier>
      </section>
    </section>

    <unnnic-modal
      v-if="room"
      :showModal="isCloseChatModalOpen"
      @close="isCloseChatModalOpen = false"
      :text="$t('chats.end')"
      :description="$t('chats.end_confirmation', { name: room.contact.name })"
      modal-icon="alert-circle-1"
      scheme="feedback-yellow"
    >
      <template #options>
        <unnnic-button :text="$t('confirm')" type="terciary" @click="closeChat" />
        <unnnic-button :text="$t('cancel')" @click="isCloseChatModalOpen = false" />
      </template>
    </unnnic-modal>

    <unnnic-modal
      v-if="room"
      :showModal="isGetChatConfirmationModalOpen"
      @close="isGetChatConfirmationModalOpen = false"
      :text="$t('chats.get_chat_question')"
      :description="`Confirme se deseja realizar o atendimento de ${room.contact.name}`"
      modal-icon="messages-bubble-1"
      scheme="neutral-darkest"
    >
      <template #options>
        <unnnic-button
          :text="$t('cancel')"
          type="terciary"
          @click="isGetChatConfirmationModalOpen = false"
        />
        <unnnic-button :text="$t('confirm')" type="secondary" @click="takeRoom" />
      </template>
    </unnnic-modal>

    <template #aside>
      <component :is="sidebarComponent.name" v-on="sidebarComponent.listeners" />
    </template>
  </chats-layout>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

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
      type: String,
      default: '',
    },
  },

  data: () => ({
    audioMessage: null,
    componentInAsideSlot: '',
    editorMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
    isGetChatConfirmationModalOpen: false,
  }),

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
    }),
    ...mapGetters('rooms', {
      messages: 'groupedActiveRoomsMessage',
    }),
    isMessageEditorVisible() {
      return this.room.is_active && !!this.room.user;
    },
    isRoomClassifierVisible() {
      return !this.room.is_active && !this.room.tags;
    },
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
    takeRoom() {
      console.log('took the room');
      this.isGetChatConfirmationModalOpen = false;
    },
    closeChat() {
      this.$store.commit('chats/setActiveChat', { ...this.room, closed: true });
      this.isCloseChatModalOpen = false;
    },
    scrollMessagesToBottom() {
      if (!this.$refs.chatMessages) return;
      this.$refs.chatMessages.$el.scrollTop = this.$refs.chatMessages.$el.scrollHeight;
    },
    async setActiveRoom(uuid) {
      const room = this.$store.getters['rooms/getRoomById'](uuid);
      if (!room) this.$router.push({ name: 'home' });
      await this.$store.dispatch('rooms/setActiveRoom', room);
    },
    async getRoomMessages() {
      await this.$store.dispatch('rooms/getActiveRoomMessages');
      this.$nextTick(this.scrollMessagesToBottom);
    },
    async sendFileMessage(files) {
      try {
        await this.$store.dispatch('rooms/sendFiles', files);
        this.scrollMessagesToBottom();
      } catch (e) {
        console.error('O upload de alguns arquivos pode não ter sido concluído');
      }
    },
    async sendMessage() {
      const message = this.editorMessage.trim();
      if (!message) return;

      await this.$store.dispatch('rooms/sendMessage', message);

      this.scrollMessagesToBottom();
      this.editorMessage = '';
    },
    async sendAudio() {
      if (!this.audioMessage) return;

      const message = {
        isAudio: true,
        audio: this.audioMessage,
      };

      await this.$store.dispatch('chats/sendMessage', message);

      this.scrollMessagesToBottom();
      this.audioMessage = null;
    },
    getTodayDate() {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(new Date());
    },
    async setChatTags() {
      const { room, tags } = this;

      await this.$store.dispatch('chats/closeChat', {
        id: room.id,
        username: room.username,
        agent: 'Ana',
        date: this.getTodayDate(),
        closed: true,
        tags,
        messages: room.messages,
      });

      this.$store.commit('chats/setActiveChat', null);
      this.$router.replace('/');
    },
  },

  watch: {
    room(newValue) {
      if (!newValue) this.componentInAsideSlot = '';
    },
    id: {
      immediate: true,
      async handler() {
        await this.setActiveRoom(this.id);
        this.getRoomMessages();
      },
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

  .get-chat-button-container {
    margin-top: auto;
    margin-right: $unnnic-spacing-inline-sm;

    .get-chat-button {
      width: 100%;
    }
  }
}
</style>
