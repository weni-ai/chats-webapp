<template>
  <chats-layout
    ref="chats-layout"
    @select-quick-message="(quickMessage) => updateTextBoxMessage(quickMessage.text)"
  >
    <div v-if="discussionId">{{ discussionId }}</div>
    <room-loading v-show="isRoomSkeletonActive" />
    <chats-background v-if="!room && !discussion && !isRoomSkeletonActive" />
    <section v-if="!!room && !discussion" v-show="!isRoomSkeletonActive" class="active-chat">
      <unnnic-chats-header
        :title="room.contact.name || ''"
        :avatarClick="() => openRoomContactInfo()"
        :titleClick="() => openRoomContactInfo()"
        :avatarName="room.contact.name"
        :close="openModalCloseChat"
      />
      <chat-header-send-flow v-if="!room.is_24h_valid" @send-flow="openFlowsTrigger" />
      <chats-dropzone @open-file-uploader="openFileUploader" :show="room.user && room.is_24h_valid">
        <home-room-messages @handle-room-skeleton="isRoomSkeletonActive = $event" />

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

    <home-discussion-messages
      v-if="!!discussion"
      @open-file-uploader="openFileUploader"
      @handle-room-skeleton="isRoomSkeletonActive = $event"
    />

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
        <unnnic-button :text="$t('cancel')" type="tertiary" @click="isCloseChatModalOpen = false" />
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
      <contact-info v-if="room && isRoomContactInfoOpen" @close="closeRoomContactInfo" />
      <discussion-sidebar v-if="discussion" />
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
import ContactInfo from '@/components/chats/ContactInfo';
import DiscussionSidebar from '@/components/chats/DiscussionSidebar';
import ChatClassifier from '@/components/chats/ChatClassifier';
import ModalCloseChat from '@/views/chats/ModalCloseChat.vue';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';
import MessageManager from '@/components/chats/MessageManager';

import FileUploader from '@/components/chats/MessageManager/FileUploader';
import RoomLoading from '@/views/loadings/Room.vue';
import HomeDiscussionMessages from './HomeDiscussionMessages';
import HomeRoomMessages from './HomeRoomMessages';

export default {
  name: 'ChatsHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ChatsDropzone,
    ChatHeaderSendFlow,
    ContactInfo,
    HomeDiscussionMessages,
    HomeRoomMessages,
    DiscussionSidebar,
    MessageManager,
    ChatClassifier,
    ModalCloseChat,
    FileUploader,
    ModalGetChat,
    RoomLoading,
  },

  props: {
    roomId: {
      type: String,
      default: '',
    },
    discussionId: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    /**
     * @type {HTMLAudioElement}
     */
    audioMessage: null,
    isRoomContactInfoOpen: false,
    textBoxMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
    sectorTags: [],
    isGetChatConfirmationModalOpen: false,
    isRoomClassifierVisible: false,
    totalValue: undefined,
    isLoading: false,
    showCloseModal: false,
    files: [],
    isRoomSkeletonActive: false,
  }),

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      room: (state) => state.chats.rooms.activeRoom,
      rooms: (state) => state.chats.rooms.rooms,
      discussion: (state) => state.chats.discussions.activeDiscussion,
      discussions: (state) => state.chats.discussions.discussions,
      roomMessagesNext: (state) => state.chats.roomMessages.roomMessagesNext,
      listRoomHasNext: (state) => state.chats.rooms.listRoomHasNext,
      showModalAssumedChat: ({ dashboard }) => dashboard.showModalAssumedChat,
      assumedChatContactName: ({ dashboard }) => dashboard.assumedChatContactName,
    }),
    isMessageManagerVisible() {
      return (
        !this.isRoomClassifierVisible &&
        this.room.is_active &&
        this.room.is_24h_valid &&
        !this.room.wating_answer &&
        !!this.room.user
      );
    },
  },

  methods: {
    async classifyRoom() {
      this.isRoomClassifierVisible = true;
      this.isCloseChatModalOpen = false;
      const response = await Queue.tags(this.room.queue.uuid);
      this.sectorTags = response.results;
    },
    openRoomContactInfo() {
      this.isRoomContactInfoOpen = true;
    },
    closeRoomContactInfo() {
      this.isRoomContactInfoOpen = false;
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
      this.$store.dispatch('chats/rooms/removeRoom', uuid);
    },
    async setActiveRoom(uuid) {
      this.isRoomSkeletonActive = true;
      const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
      await this.$store.dispatch('chats/rooms/getCanUseCopilot');
      this.closeRoomContactInfo();
      this.page = 0;
      this.readMessages();
    },
    async setActiveDiscussion(uuid) {
      const discussion = this.$store.getters['chats/discussions/getDiscussionById'](uuid);
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
    },

    whenGetChat() {
      this.closeRoomContactInfo();
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
        await this.$store.dispatch('chats/roomMessages/sendMedias', { files, updateLoadingFiles });
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
      await this.$store.dispatch('chats/roomMessages/sendMedias', {
        files: [audio],
        updateLoadingFiles,
      });
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

    updateTextBoxMessage(message) {
      this.textBoxMessage = message;
    },
  },

  watch: {
    room(newValue) {
      if (!newValue) this.closeRoomContactInfo();
      if (newValue) this.updateTextBoxMessage('');

      if (this.rooms.length > 0) {
        if (!newValue?.uuid) {
          this.$router.replace({ name: 'home' });
          return;
        }

        if (newValue?.uuid !== this.roomId) {
          this.$router.replace({ name: 'room', params: { roomId: newValue.uuid } });
        }
      }
    },
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (roomId && roomId !== this.room?.uuid) {
          if (this.$store.state.chats.rooms.newMessagesByRoom[roomId]) {
            this.$delete(this.$store.state.chats.rooms.newMessagesByRoom, roomId);
          }

          await this.$store.dispatch('chats/roomMessages/resetRoomMessages');
          // await this.setActiveRoom(roomId);
        }
        this.isRoomClassifierVisible = false;
      },
    },
    async rooms(rooms) {
      if (rooms.length > 0 && this.roomId && this.roomId !== this.room?.uuid) {
        await this.setActiveRoom(this.roomId);
        if (this.$route.name !== 'home' && !this.room) {
          this.$router.replace({ name: 'home' });
          this.isRoomSkeletonActive = false;
        }
      }
    },
    async discussion(newValue) {
      if (this.rooms.length > 0) {
        if (!newValue?.uuid) {
          this.$router.replace({ name: 'home' });
          return;
        }

        if (newValue?.uuid !== this.discussionId) {
          this.$router.replace({ name: 'discussion', params: { discussionId: newValue.uuid } });
        }
      }
    },
    discussionId: {
      immediate: true,
      async handler(discussionId) {
        if (discussionId && discussionId !== this.discussion?.uuid) {
          await this.$store.dispatch('chats/discussionMessages/resetDiscussionMessages');
          // await this.setActiveDiscussion(discussionId);
        }
      },
    },
    async discussions(discussions) {
      if (
        discussions.length > 0 &&
        this.discussionId &&
        this.discussionId !== this.discussion?.uuid
      ) {
        await this.setActiveDiscussion(this.discussionId);
        if (this.$route.name !== 'home' && !this.discussion) {
          this.$router.replace({ name: 'home' });
          this.isRoomSkeletonActive = false;
        }
      }
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
