<template>
  <chats-layout
    ref="chats-layout"
    :class="['home-chats-layout', { 'has-discussion': !!discussion }]"
    @select-quick-message="(quickMessage) => updateTextBoxMessage(quickMessage.text)"
  >
    <chats-background v-if="!room && !discussion && !isChatSkeletonActive" />
    <section v-if="!!room || !!discussion" class="active-chat">
      <home-chat-headers
        :isLoading="isChatSkeletonActive"
        @openRoomContactInfo="openRoomContactInfo"
        @openModalCloseChat="openModalCloseChat"
        @openFlowsTrigger="openFlowsTrigger"
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
          :showSkeletonLoading="isChatSkeletonActive"
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
        v-if="discussion"
        v-show="!isMessageManagerDiscussionVisible"
        @join="whenJoinDiscussion"
      />
    </section>

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

import RoomMessages from '@/components/chats/chat/RoomMessages';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages';
import DiscussionSidebar from '@/components/chats/DiscussionSidebar';
import ContactInfo from '@/components/chats/ContactInfo';
import FileUploader from '@/components/chats/MessageManager/FileUploader';

import Room from '@/services/api/resources/chats/room';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';
import MessageManager from '@/components/chats/MessageManager';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion';

import HomeChatHeaders from './HomeChatHeaders.vue';
import ModalCloseChat from './ModalCloseChat.vue';

export default {
  name: 'ViewHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ChatsDropzone,
    ContactInfo,
    DiscussionMessages,
    RoomMessages,
    DiscussionSidebar,
    MessageManager,
    ButtonJoinDiscussion,
    HomeChatHeaders,
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
    isGetChatConfirmationModalOpen: false,
    totalValue: undefined,
    showCloseModal: false,
    files: [],
    isChatSkeletonActive: false,
    tempJoinedDiscussions: [],
  }),

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      room: (state) => state.chats.rooms.activeRoom,
      rooms: (state) => state.chats.rooms.rooms,
      discussion: (state) => state.chats.discussions.activeDiscussion,
      discussions: (state) => state.chats.discussions.discussions,
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
        !room.wating_answer
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
    isCurrentUserInDiscussion() {
      return this.tempJoinedDiscussions.includes(this.discussion.uuid);
    },
  },

  async created() {
    if (this.$route.name === 'home') {
      await this.$store.dispatch('chats/discussionMessages/resetDiscussionMessages');
      await this.$store.dispatch('chats/roomMessages/resetRoomMessages');
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', null);
      await this.$store.dispatch('chats/rooms/setActiveRoom', null);
    }
  },

  methods: {
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
    async setActiveRoom(uuid) {
      const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },
    async setActiveDiscussion(uuid) {
      const discussion = this.$store.getters['chats/discussions/getDiscussionById'](uuid);
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
    },

    whenJoinDiscussion() {
      this.tempJoinedDiscussions.push(this.discussion.uuid);
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
        if (this.$route.name !== 'home' && !newValue) {
          this.$router.replace({ name: 'home' });
          return;
        }

        if (!newValue?.uuid) {
          return;
        }

        if (newValue.uuid !== this.roomId && !this.discussionId) {
          this.$router.replace({ name: 'room', params: { roomId: newValue.uuid } });
        }

        if (newValue.uuid !== oldValue?.uuid) {
          this.isChatSkeletonActive = true;
          this.updateTextBoxMessage('');
          this.page = 0;
          this.closeRoomContactInfo();

          if (!this.discussionId) {
            await this.$store.dispatch('chats/rooms/getCanUseCopilot');
            this.readMessages();
          }
          this.isChatSkeletonActive = false;
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
      },
    },
    async rooms(rooms) {
      if (rooms.length > 0 && this.roomId && this.roomId !== this.room?.uuid) {
        await this.setActiveRoom(this.roomId);
        if (this.$route.name !== 'home' && !this.room) {
          this.$router.replace({ name: 'home' });
          this.isChatSkeletonActive = false;
        }
      }
    },
    async discussion(newValue) {
      if (this.discussions.length > 0) {
        if (this.$route.name !== 'home' && !newValue) {
          this.$router.replace({ name: 'home' });
          return;
        }

        if (!newValue?.uuid) {
          return;
        }

        if (newValue.uuid !== this.discussionId) {
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
          this.isChatSkeletonActive = false;
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
.home-chats-layout {
  &.has-aside.has-discussion {
    grid-template-columns: 3fr 5.5fr 3.5fr;
  }
}

.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
  padding-bottom: $unnnic-spacing-xs;

  .chat-classifier {
    margin-top: auto;
    margin-left: -$unnnic-spacing-inline-md;
    margin-bottom: -$unnnic-spacing-inline-sm;
  }
}

.get-chat-button {
  margin: auto $unnnic-spacing-inline-sm 0;
}
</style>
