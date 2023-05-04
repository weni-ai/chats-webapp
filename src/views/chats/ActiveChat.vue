<template>
  <chats-layout>
    <section v-if="!!room" class="active-chat">
      <chat-header
        :room="room"
        :closeButtonTooltip="$t('chats.end')"
        @close="openModalCloseChat"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
        @open-select-flow="
          componentInAsideSlot =
            componentInAsideSlot === 'layoutTemplateMessage' ? '' : 'layoutTemplateMessage'
        "
        :alert="!this.room.is_24h_valid"
      />
      <chat-messages
        :room="room"
        :messages="messages"
        class="messages"
        @show-contact-info="componentInAsideSlot = 'contactInfo'"
        ref="chatMessages"
        @scrollTop="searchForMoreMessages"
      />

      <div v-if="isMessageEditorVisible && !room.is_waiting" class="message-editor">
        <message-editor
          ref="message-editor"
          v-model="editorMessage"
          :audio.sync="audioMessage"
          @show-quick-messages="
            componentInAsideSlot = componentInAsideSlot === 'quickMessages' ? '' : 'quickMessages'
          "
          @send-message="sendMessage"
          @send-audio="sendAudio"
          @upload="sendFileMessage($event)"
          :loadingValue="totalValue"
          :loading="isLoading"
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
        <chat-classifier
          v-model="tags"
          :tags="sectorTags"
          label="Por favor, classifique o atendimento:"
        >
          <template #actions>
            <unnnic-button :text="$t('confirm')" type="secondary" size="small" @click="closeRoom" />
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
        <unnnic-button :text="$t('cancel')" type="terciary" @click="isCloseChatModalOpen = false" />
        <unnnic-button :text="$t('confirm')" type="secondary" @click="classifyRoom" />
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
    <modal-close-chat v-if="showCloseModal" @close="closeModalCloseChat" :room="room" />
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
import ModalCloseChat from '@/views/chats/ModalCloseChat.vue';
import LayoutTemplateMessage from '@/components/chats/TemplateMessages/LayoutTemplateMessage';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

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
    ModalCloseChat,
    LayoutTemplateMessage,
  },

  props: {
    id: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    /**
     * @type {HTMLAudioElement}
     */
    audioMessage: null,
    componentInAsideSlot: '',
    editorMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
    sectorTags: [],
    isGetChatConfirmationModalOpen: false,
    isRoomClassifierVisible: false,
    totalValue: undefined,
    isLoading: false,
    page: 0,
    limit: 20,
    showCloseModal: false,
    showAlertForLastMessage: false,
  }),

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
      hasNext: (state) => state.rooms.hasNext,
      listRoomHasNext: (state) => state.rooms.listRoomHasNext,
    }),
    ...mapGetters('rooms', {
      messages: 'groupedActiveRoomsMessage',
    }),
    isMessageEditorVisible() {
      return (
        !this.isRoomClassifierVisible &&
        this.room.is_active &&
        this.room.is_24h_valid &&
        !this.room.wating_answer &&
        !!this.room.user
      );
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
              this.editorMessage = quickMessage.text;
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
        layoutTemplateMessage: {
          name: LayoutTemplateMessage.name,
          listeners: {
            close: () => {
              this.componentInAsideSlot = '';
            },
            contact: this.room,
          },
        },
      };
    },
  },

  methods: {
    async classifyRoom() {
      this.isRoomClassifierVisible = true;
      this.isCloseChatModalOpen = false;
      const response = await Queue.tags(this.room.queue.uuid);
      this.sectorTags = response.results;
    },
    async takeRoom() {
      await Room.take(this.room.uuid, this.me.email);
      this.isGetChatConfirmationModalOpen = false;
      this.setActiveRoom(this.room.uuid);
    },
    async closeRoom() {
      // if (this.tags.length === 0) return;
      const { uuid } = this.room;

      const tags = this.tags.map((tag) => tag.uuid);
      await Room.close(uuid, tags);
      this.$router.replace({ name: 'home' });
      this.$store.dispatch('rooms/removeRoom', uuid);
    },
    scrollMessagesToBottom() {
      if (!this.$refs.chatMessages) return;
      this.$refs.chatMessages.$el.scrollTop = this.$refs.chatMessages.$el.scrollHeight;
    },
    async setActiveRoom(uuid) {
      const room = this.$store.getters['rooms/getRoomById'](uuid);
      if (!room) this.$router.push({ name: 'home' });
      await this.$store.dispatch('rooms/setActiveRoom', room);
      this.componentInAsideSlot = '';
      this.page = 0;
    },
    async getRoomMessages(concat) {
      this.isLoading = true;

      try {
        await this.$store.dispatch('rooms/getActiveRoomMessages', {
          offset: this.page * this.limit,
          concat,
          limit: this.limit,
        });
        // this.$nextTick(this.scrollMessagesToBottom);
        this.isRoomClassifierVisible = false;
        this.isLoading = false;
        this.dateOfLastMessage();
      } catch (error) {
        this.isLoading = false;
        console.log(error);
      }
    },

    searchForMoreMessages() {
      if (this.hasNext) {
        this.page += 1;
        this.getRoomMessages(true);
      }
    },
    async sendFileMessage(files) {
      try {
        const loadingFiles = {};
        const updateLoadingFiles = (messageUuid, progress) => {
          loadingFiles[messageUuid] = progress;
          this.totalValue =
            Object.values(loadingFiles).reduce((acc, value) => acc + value) /
            Object.keys(loadingFiles).length;
        };
        await this.$store.dispatch('rooms/sendMedias', { files, updateLoadingFiles });
        this.totalValue = undefined;
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
      const loadingFiles = {};
      const updateLoadingFiles = (messageUuid, progress) => {
        loadingFiles[messageUuid] = progress;
        this.totalValue =
          Object.values(loadingFiles).reduce((acc, value) => acc + value) /
          Object.keys(loadingFiles).length;
      };
      const response = await fetch(this.audioMessage.src);
      const blob = await response.blob();
      const audio = new File([blob], `${Date.now().toString()}.mp3`, { type: 'audio/mpeg3' });
      await this.$store.dispatch('rooms/sendMedias', { files: [audio], updateLoadingFiles });
      this.totalValue = undefined;
      this.scrollMessagesToBottom();
      this.$refs['message-editor'].clearAudio();
      this.audioMessage = null;
    },
    getTodayDate() {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(new Date());
    },
    openModalCloseChat() {
      this.showCloseModal = true;
    },

    closeModalCloseChat() {
      this.showCloseModal = false;
    },

    dateOfLastMessage() {
      if (!this.room) return;
      if (!this.room.is_24h_valid) {
        this.showAlertForLastMessage = true;
      } else {
        this.showAlertForLastMessage = false;
      }
    },
  },

  watch: {
    room(newValue) {
      if (!newValue) this.componentInAsideSlot = '';
      if (newValue) this.editorMessage = '';
    },
    id: {
      immediate: true,
      async handler() {
        if (this.$store.state.rooms.newMessagesByRoom[this.id]) {
          this.$delete(this.$store.state.rooms.newMessagesByRoom, this.id);
        }

        await this.setActiveRoom(this.id);
        this.getRoomMessages();
      },
    },

    messages() {
      this.$nextTick(this.scrollMessagesToBottom);
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
    margin-top: auto;
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
