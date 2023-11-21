<template>
  <chats-layout
    ref="chats-layout"
    @select-quick-message="(quickMessage) => updateTextBoxMessage(quickMessage.text)"
  >
    <chats-background v-if="!room && !discussion && !isRoomSkeletonActive" />
    <section v-if="!!room || !!discussion" class="active-chat">
      <chat-header-loading v-show="isRoomSkeletonActive" />
      <unnnic-chats-header
        v-show="!isRoomSkeletonActive"
        v-if="!!room && !discussion"
        :title="room.contact.name || ''"
        :avatarClick="() => openRoomContactInfo()"
        :titleClick="() => openRoomContactInfo()"
        :avatarName="room?.contact?.name"
        :close="openModalCloseChat"
      />
      <unnnic-chats-header
        v-show="!isRoomSkeletonActive"
        v-if="!!discussion"
        class="discussion-header"
        :title="discussion.subject"
        :subtitle="`${$tc('discussions.title')} ${$t('about')} ${discussion.contact}`"
        avatarIcon="forum"
        size="small"
      />

      <chat-header-send-flow
        v-if="!!room && !discussion && !room.is_24h_valid && !isRoomSkeletonActive"
        @send-flow="openFlowsTrigger"
      />
      <chats-dropzone
        @open-file-uploader="openFileUploader"
        :show="(!!room && room.user && room.is_24h_valid) || !!discussion"
      >
        <room-messages v-if="!!room && !discussion" />
        <discussion-messages v-if="!!discussion" />

        <message-manager
          v-if="isMessageManagerRoomVisible || isMessageManagerDiscussionVisible"
          v-model="textBoxMessage"
          :loadingFileValue="totalValue"
          :showSkeletonLoading="isRoomSkeletonActive"
          @show-quick-messages="handlerShowQuickMessages"
          @open-file-uploader="openFileUploader"
        />
      </chats-dropzone>

      <unnnic-button
        v-if="!room?.user && !discussion"
        class="get-chat-button"
        :text="$t('chats.get_chat')"
        type="primary"
        @click="isGetChatConfirmationModalOpen = true"
      />

      <button-join-discussion
        v-if="discussion && !isMessageManagerDiscussionVisible"
        @join="isCurrentUserInDiscussion = true"
      />

      <!-- <section v-if="isRoomClassifierVisible" class="chat-classifier">
        <chat-classifier
          v-model="tags"
          :tags="sectorTags"
          label="Por favor, classifique o atendimento:"
        >
          <template #actions>
            <unnnic-button :text="$t('confirm')" type="secondary" size="small" @click="closeRoom" />
          </template>
        </chat-classifier>
      </section> -->
    </section>

    <!-- <unnnic-modal
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
    </unnnic-modal> -->

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
      <contact-info
        v-if="room && isRoomContactInfoOpen && !discussion"
        @close="closeRoomContactInfo"
      />
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

import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader';
import RoomMessages from '@/components/chats/chat/RoomMessages';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages';
import DiscussionSidebar from '@/components/chats/DiscussionSidebar';
import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow';
import ContactInfo from '@/components/chats/ContactInfo';
import FileUploader from '@/components/chats/MessageManager/FileUploader';
// import ChatClassifier from '@/components/chats/ChatClassifier';
import ModalCloseChat from '@/views/chats/ModalCloseChat.vue';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';
import MessageManager from '@/components/chats/MessageManager';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion';

export default {
  name: 'ChatsHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ChatsDropzone,
    ChatHeaderLoading,
    ChatHeaderSendFlow,
    ContactInfo,
    DiscussionMessages,
    RoomMessages,
    DiscussionSidebar,
    MessageManager,
    ButtonJoinDiscussion,
    // ChatClassifier,
    ModalCloseChat,
    FileUploader,
    ModalGetChat,
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
    isRoomContactInfoOpen: false,
    textBoxMessage: '',
    isCloseChatModalOpen: false,
    tags: [],
    sectorTags: [],
    isGetChatConfirmationModalOpen: false,
    isRoomClassifierVisible: false,
    totalValue: undefined,
    showCloseModal: false,
    files: [],
    isRoomSkeletonActive: false,
    isCurrentUserInDiscussion: false,
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
    isMessageManagerRoomVisible() {
      const { room } = this;
      return (
        room &&
        room.user &&
        room.is_active &&
        room.is_24h_valid &&
        !room.is_waiting &&
        !room.wating_answer &&
        !this.isRoomClassifierVisible
      );
    },
    isMessageManagerDiscussionVisible() {
      const { discussion } = this;
      return (
        discussion &&
        (!discussion.is_queued ||
          discussion.created_by === this.me.email ||
          this.isCurrentUserInDiscussion)
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
    // async closeRoom() {
    //   // if (this.tags.length === 0) return;
    //   const { uuid } = this.room;

    //   const tags = this.tags.map((tag) => tag.uuid);
    //   await Room.close(uuid, tags);
    //   this.$store.dispatch('chats/rooms/removeRoom', uuid);
    // },
    async setActiveRoom(uuid) {
      const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
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
        const actionType = this.discussionId
          ? 'chats/discussionMessages/sendDiscussionMedias'
          : 'chats/roomMessages/sendRoomMedias';

        await this.$store.dispatch(actionType, {
          files,
          updateLoadingFiles,
        });
      } catch (e) {
        console.error('O upload de alguns arquivos pode não ter sido concluído');
      } finally {
        this.totalValue = undefined;
      }
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

      if (files?.length > 0) {
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
    async room(newValue, oldValue) {
      if (this.rooms.length > 0) {
        if (!newValue?.uuid) {
          this.$router.replace({ name: 'home' });
          return;
        }

        if (newValue.uuid !== oldValue?.uuid) {
          this.isRoomSkeletonActive = true;
          this.updateTextBoxMessage('');
          this.page = 0;
          this.closeRoomContactInfo();

          if (!this.discussionId) {
            await this.$store.dispatch('chats/rooms/getCanUseCopilot');
            this.readMessages();
          }
          this.isRoomSkeletonActive = false;
        }
        if (newValue?.uuid !== this.roomId && !this.discussionId) {
          this.$router.replace({ name: 'room', params: { roomId: newValue.uuid } });
        }
      }
    },
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (roomId && roomId === this.room?.uuid) {
          const hasNewMessages = this.$store.state.chats.rooms.newMessagesByRoom[roomId];

          if (hasNewMessages) {
            this.$store.dispatch('chats/rooms/resetNewMessagesByRoom', {
              room: roomId,
            });
          }
        }

        await this.$store.dispatch('chats/roomMessages/resetRoomMessages');
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
        if (discussionId && discussionId === this.discussion?.uuid) {
          const hasNewMessages =
            this.$store.state.chats.discussions.newMessagesByDiscussion[discussionId];

          if (hasNewMessages) {
            this.$store.dispatch('chats/discussions/resetNewMessagesByDiscussion', {
              discussion: discussionId,
            });
          }
        }
        await this.$store.dispatch('chats/discussionMessages/resetDiscussionMessages');
      },
    },
    async discussions(discussions) {
      if (
        discussions.length > 0 &&
        this.discussionId &&
        this.discussionId !== this.discussion?.uuid
      ) {
        await this.setActiveDiscussion(this.discussionId);
        if (this.$route.name !== 'home' && !this.discussion && !this.room) {
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

  .discussion-header {
    :deep(.unnnic-chats-header) {
      .unnnic-chats-header__avatar-icon {
        background-color: $unnnic-color-aux-purple-500;

        [class*='unnnic-icon'] {
          color: $unnnic-color-weni-50;
        }
      }
    }
  }
}

.get-chat-button {
  margin: auto $unnnic-spacing-inline-sm 0;
}
</style>
