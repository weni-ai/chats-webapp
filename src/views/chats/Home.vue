<template>
  <chats-layout
    ref="chats-layout"
    @select-quick-message="(quickMessage) => updateEditorMessage(quickMessage.text)"
  >
    <chats-background v-if="!room" />
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
        @reconnect="searchMessages"
        :alertNetwork="this.networkError"
      />
      <chats-dropzone @open-file-uploader="openFileUploader" :show="room.user && room.is_24h_valid">
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
            @show-quick-messages="handlerShowQuickMessages"
            @send-message="sendMessage"
            @send-audio="sendAudio"
            @open-file-uploader="openFileUploader"
            :loadingValue="totalValue"
            :loading="isLoading"
          />
        </div>
      </chats-dropzone>

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

    <modal-get-chat
      v-if="room"
      :showModal="isGetChatConfirmationModalOpen"
      @closeModal="isGetChatConfirmationModalOpen = false"
      :title="$t('chats.get_chat_question')"
      :description="`Confirme se deseja realizar o atendimento de ${room.contact.name}`"
      :whenGetChat="whenGetChat"
    />

    <unnnic-modal
      :text="$t('chats.your_chat_assumed', { contact: assumedChatContactName })"
      :description="$t('chats.your_chat_assumed_description', { contact: assumedChatContactName })"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showModalAssumedChat"
      @close="closeModalAssumedChat"
    />

    <file-uploader v-model="files" ref="fileUploader" @upload="sendFileMessage" />

    <template #aside>
      <component :is="sidebarComponent.name" v-on="sidebarComponent.listeners" />
    </template>
    <modal-close-chat v-if="showCloseModal" @close="closeModalCloseChat" :room="room" />
  </chats-layout>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import * as notifications from '@/utils/notifications';

import ChatsLayout from '@/layouts/ChatsLayout';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';
import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';

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
import ModalGetChat from '@/components/chats/chat/ModalGetChat';

import FileUploader from '@/components/chats/MessageEditor/FileUploader';

export default {
  name: 'ChatsHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ChatsDropzone,
    ChatHeader,
    ChatMessages,
    ContactInfo,
    QuickMessages,
    MessageEditor,
    ChatClassifier,
    ModalCloseChat,
    FileUploader,
    LayoutTemplateMessage,
    ModalGetChat,
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
    networkError: false,
    files: [],
  }),

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
      hasNext: (state) => state.rooms.hasNext,
      listRoomHasNext: (state) => state.rooms.listRoomHasNext,
      showModalAssumedChat: ({ dashboard }) => dashboard.showModalAssumedChat,
      assumedChatContactName: ({ dashboard }) => dashboard.assumedChatContactName,
    }),
    ...mapGetters('rooms', {
      messages: 'groupedActiveRoomsMessage',
    }),
    isMessageEditorVisible() {
      return (
        !this.isRoomClassifierVisible &&
        this.room.is_active &&
        this.room.is_24h_valid &&
        !this.networkError &&
        !this.room.wating_answer &&
        !!this.room.user
      );
    },
    sidebarComponent() {
      return this.sidebarComponents[this.componentInAsideSlot] || {};
    },
    sidebarComponents() {
      return {
        // quickMessages: {
        //   name: QuickMessages.name,
        //   listeners: {
        //     close: () => {
        //       this.componentInAsideSlot = '';
        //     },
        //     'select-quick-message': (quickMessage) => {
        //       this.editorMessage = quickMessage.text;
        //     },
        //   },
        // },
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
    async readMessages() {
      if (this.room && this.room.uuid && this.room.user && this.room.user.email === this.me.email) {
        await Room.updateReadMessages(this.room.uuid, true);
      }
    },
    async closeRoom() {
      // if (this.tags.length === 0) return;
      const { uuid } = this.room;

      const tags = this.tags.map((tag) => tag.uuid);
      await Room.close(uuid, tags);
      this.$router.replace({ name: 'home' });
      this.$store.dispatch('rooms/removeRoom', uuid);
    },
    async setActiveRoom(uuid) {
      const room = this.$store.getters['rooms/getRoomById'](uuid);
      if (this.$route.name !== 'home' && !room) {
        this.$router.replace({ name: 'home' });
      }
      await this.$store.dispatch('rooms/setActiveRoom', room);
      this.componentInAsideSlot = '';
      this.page = 0;
      this.readMessages();
    },
    whenGetChat() {
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
        this.isRoomClassifierVisible = false;
        this.isLoading = false;
        this.networkError = false;
        this.dateOfLastMessage();
        this.readMessages();
      } catch (error) {
        this.isLoading = false;
        console.log(error);
        if (error.code === 'ERR_NETWORK') this.networkError = true;
      }
    },

    searchMessages() {
      this.getRoomMessages(false);
    },

    searchForMoreMessages() {
      if (this.hasNext) {
        this.page += 1;
        this.getRoomMessages(true);
      }
    },
    async sendFileMessage() {
      const { files } = this;
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
      } catch (e) {
        console.error('O upload de alguns arquivos pode não ter sido concluído');
      }
    },

    async sendMessage() {
      const message = this.editorMessage.trim();
      if (!message) return;

      await this.$store.dispatch('rooms/sendMessage', message);

      this.editorMessage = '';
    },
    async sendAudio() {
      if (!this.audioMessage || this.isLoading) return;
      this.isLoading = true;

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
      this.$refs['message-editor'].clearAudio();
      this.audioMessage = null;

      this.isLoading = false;
    },
    getTodayDate() {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(new Date());
    },

    handlerShowQuickMessages() {
      this.$refs['chats-layout']?.handlerShowQuickMessages();
    },

    openModalCloseChat() {
      this.showCloseModal = true;
    },

    closeModalCloseChat() {
      this.showCloseModal = false;
    },

    openFileUploader(files) {
      this.$refs.fileUploader.open();

      if (files) {
        this.files = [...files];
      }
    },

    closeModalAssumedChat() {
      this.$store.dispatch('dashboard/setShowModalAssumedChat', false);
    },

    dateOfLastMessage() {
      if (!this.room) return;
      if (!this.room.is_24h_valid) {
        this.showAlertForLastMessage = true;
      } else {
        this.showAlertForLastMessage = false;
      }
    },

    updateEditorMessage(message) {
      this.editorMessage = message;
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
  },

  mounted() {
    notifications.requestPermission();
  },
};
</script>

<style lang="scss" scoped>
.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
  padding: $unnnic-spacing-stack-sm 0;

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
    margin-top: auto;
  }
}
.get-chat-button-container {
  margin-top: auto;
  margin-right: $unnnic-spacing-inline-sm;

  .get-chat-button {
    width: 100%;
  }
}
</style>
