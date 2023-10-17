<template>
  <chats-layout
    ref="chats-layout"
    @select-quick-message="(quickMessage) => updateTextBoxMessage(quickMessage.text)"
  >
    <room-loading v-show="isRoomSkeletonActive" />
    <chats-background v-if="!room && !isRoomSkeletonActive" />
    <section v-if="!!room && !isRoomSkeletonActive" class="active-chat">
      <unnnic-chats-header
        :title="room.contact.name || ''"
        :avatarClick="openContactInfo"
        :titleClick="openContactInfo"
        :avatarName="room.contact.name"
        :close="openModalCloseChat"
      />
      <chat-header-send-flow v-if="!room.is_24h_valid" @send-flow="openFlowsTrigger" />
      <chats-dropzone @open-file-uploader="openFileUploader" :show="room.user && room.is_24h_valid">
        <chat-messages
          :room="room"
          @show-contact-info="componentInAsideSlot = 'contactInfo'"
          @scrollTop="searchForMoreMessages"
        />

        <message-manager
          v-if="isMessageManagerVisible && !room.is_waiting"
          ref="message-editor"
          v-model="textBoxMessage"
          :audio.sync="audioMessage"
          @show-quick-messages="handlerShowQuickMessages"
          @send-audio="sendAudio"
          @open-file-uploader="openFileUploader"
          :loadingValue="totalValue"
          :loading="isLoading"
        />
      </chats-dropzone>

      <div v-if="!room.user" class="get-chat-button-container">
        <unnnic-button
          class="get-chat-button"
          :text="$t('chats.get_chat')"
          type="primary"
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
import { mapState } from 'vuex';

import * as notifications from '@/utils/notifications';

import ChatsLayout from '@/layouts/ChatsLayout';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';
import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';

import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow';
import ChatMessages from '@/components/chats/chat/ChatMessagesNext';
import ContactInfo from '@/components/chats/ContactInfo';
import ChatClassifier from '@/components/chats/ChatClassifier';
import QuickMessages from '@/components/chats/QuickMessages';
import ModalCloseChat from '@/views/chats/ModalCloseChat.vue';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';
import MessageManager from '@/components/chats/MessageManager';

import FileUploader from '@/components/chats/MessageManager/FileUploader';
import RoomLoading from '@/views/loadings/Room.vue';

export default {
  name: 'ChatsHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ChatsDropzone,
    ChatHeaderSendFlow,
    ChatMessages,
    ContactInfo,
    QuickMessages,
    MessageManager,
    ChatClassifier,
    ModalCloseChat,
    FileUploader,
    ModalGetChat,
    RoomLoading,
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
    textBoxMessage: '',
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
    isRoomSkeletonActive: false,
  }),

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
      roomMessagesNext: (state) => state.roomMessages.roomMessagesNext,
      listRoomHasNext: (state) => state.rooms.listRoomHasNext,
      showModalAssumedChat: ({ dashboard }) => dashboard.showModalAssumedChat,
      assumedChatContactName: ({ dashboard }) => dashboard.assumedChatContactName,
    }),
    isMessageManagerVisible() {
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
    async classifyRoom() {
      this.isRoomClassifierVisible = true;
      this.isCloseChatModalOpen = false;
      const response = await Queue.tags(this.room.queue.uuid);
      this.sectorTags = response.results;
    },
    openContactInfo() {
      this.componentInAsideSlot = 'contactInfo';
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
      await this.$store.dispatch('rooms/getCanUseCopilot');
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

      await this.$store
        .dispatch('roomMessages/getRoomMessages', {
          offset: this.page * this.limit,
          concat,
          limit: this.limit,
        })
        .then(() => {
          this.isRoomClassifierVisible = false;
          this.isLoading = false;
          this.networkError = false;
          this.dateOfLastMessage();
          this.readMessages();

          this.isRoomSkeletonActive = false;
        })
        .catch((error) => {
          this.isLoading = false;
          console.error(error);
          if (error.code === 'ERR_NETWORK') this.networkError = true;
        });
    },

    searchMessages() {
      this.getRoomMessages(false);
    },

    searchForMoreMessages() {
      if (this.roomMessagesNext) {
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
        await this.$store.dispatch('roomMessages/sendMedias', { files, updateLoadingFiles });
        this.totalValue = undefined;
      } catch (e) {
        console.error('O upload de alguns arquivos pode não ter sido concluído');
      }
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
      await this.$store.dispatch('roomMessages/sendMedias', { files: [audio], updateLoadingFiles });
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

    openFlowsTrigger() {
      this.$refs['chats-layout']?.openFlowsTrigger({ contact: this.room?.contact });
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

    updateTextBoxMessage(message) {
      this.textBoxMessage = message;
    },
  },

  watch: {
    room(newValue) {
      if (!newValue) this.componentInAsideSlot = '';
      if (newValue) this.updateTextBoxMessage('');
    },
    id: {
      immediate: true,
      async handler() {
        if (this.$store.state.rooms.newMessagesByRoom[this.id]) {
          this.$delete(this.$store.state.rooms.newMessagesByRoom, this.id);
        }

        this.isRoomSkeletonActive = true;
        await this.setActiveRoom(this.id);
        await this.getRoomMessages();
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
  padding-bottom: $unnnic-spacing-stack-sm;

  .chat-classifier {
    margin-top: auto;
    margin-left: -$unnnic-spacing-inline-md;
    margin-bottom: -$unnnic-spacing-inline-sm;
  }
}
.get-chat-button-container {
  margin: auto $unnnic-spacing-inline-sm 0;

  .get-chat-button {
    width: 100%;
  }
}
</style>
