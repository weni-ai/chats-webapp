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
        @openModalCloseChat="openModal('closeChat')"
        @openFlowsTrigger="openFlowsTrigger"
      />
      <chats-dropzone
        @open-file-uploader="openModalFileUploader"
        :show="(!!room && room.user && room.is_24h_valid) || !!discussion"
      >
        <room-messages v-if="!!room && !discussion" />
        <discussion-messages v-if="!!discussion" />

        <message-manager
          v-if="isMessageManagerRoomVisible || isMessageManagerDiscussionVisible"
          v-model="textBoxMessage"
          :loadingFileValue="uploadFilesProgress"
          :showSkeletonLoading="isChatSkeletonActive"
          @show-quick-messages="handlerShowQuickMessages"
          @open-file-uploader="openModalFileUploader"
        />
      </chats-dropzone>

      <unnnic-button
        v-if="!room?.user && !discussion"
        class="get-chat-button"
        :text="$t('chats.get_chat')"
        type="primary"
        @click="openModal('getChat')"
      />

      <button-join-discussion
        v-if="discussion"
        v-show="!isMessageManagerDiscussionVisible"
        @join="whenJoinDiscussion"
      />
    </section>

    <template #aside>
      <contact-info
        v-if="room && isRoomContactInfoOpen && !discussion"
        @close="closeRoomContactInfo"
      />
      <discussion-sidebar v-if="discussion" />
    </template>

    <home-modals
      ref="homeModals"
      @got-chat="closeRoomContactInfo"
      @file-uploader-progress="setUploadFilesProgress"
    />
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

import Room from '@/services/api/resources/chats/room';
import MessageManager from '@/components/chats/MessageManager';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion';

import HomeChatHeaders from './HomeChatHeaders.vue';
import HomeModals from './HomeModals.vue';

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
    HomeModals,
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

  data() {
    return {
      isRoomContactInfoOpen: false,
      textBoxMessage: '',
      uploadFilesProgress: undefined,
      isChatSkeletonActive: false,
      tempJoinedDiscussions: [],
    };
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      room: (state) => state.chats.rooms.activeRoom,
      rooms: (state) => state.chats.rooms.rooms,
      discussion: (state) => state.chats.discussions.activeDiscussion,
      discussions: (state) => state.chats.discussions.discussions,
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
    openModal(modalName) {
      this.$refs.homeModals.openModal(modalName);
    },
    openModalFileUploader(files) {
      this.$refs.homeModals.openModal('fileUploader', files);
    },
    openRoomContactInfo() {
      this.isRoomContactInfoOpen = true;
    },
    closeRoomContactInfo() {
      this.isRoomContactInfoOpen = false;
    },
    handlerShowQuickMessages() {
      this.$refs['chats-layout']?.handlerShowQuickMessages();
    },
    openFlowsTrigger() {
      this.$refs['chats-layout']?.openFlowsTrigger({ contact: this.room?.contact });
    },

    updateTextBoxMessage(message) {
      this.textBoxMessage = message;
    },
    setUploadFilesProgress(progress) {
      this.uploadFilesProgress = progress;
    },

    async setActiveRoom(uuid) {
      if (this.roomId !== this.room?.uuid) {
        const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
        if (room) {
          await this.$store.dispatch('chats/rooms/setActiveRoom', room);
        }
      }
    },
    async readMessages() {
      const { room } = this;
      if (room && room.uuid && room.user && room.user.email === this.me.email) {
        await Room.updateReadMessages(room.uuid, true);
      }
    },

    async setActiveDiscussion(uuid) {
      if (this.discussionId && this.discussionId !== this.discussion?.uuid) {
        const discussion = this.$store.getters['chats/discussions/getDiscussionById'](uuid);
        if (discussion) {
          await this.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
        }
      }
    },
    whenJoinDiscussion() {
      this.tempJoinedDiscussions.push(this.discussion.uuid);
    },

    isValidChat(activeChat) {
      return activeChat?.uuid;
    },

    async redirectIfNoChat(activeChat) {
      if (this.$route.name !== 'home' && !activeChat) {
        this.$router.replace({ name: 'home' });
        return true;
      }
      return false;
    },
    async shouldRedirect(activeChat) {
      if ((await this.redirectIfNoChat(activeChat)) || !this.isValidChat(activeChat)) {
        return true;
      }

      return false;
    },
    async redirectToActiveChat({ routeName, paramName, activeChatUuid }) {
      if (activeChatUuid !== this[paramName]) {
        this.$router.replace({ name: routeName, params: { [paramName]: activeChatUuid } });
      }
    },

    async resetActiveChatUnreadMessages({
      chatPathUuid = '',
      activeChatUuid = '',
      unreadMessages = null,
      resetUnreadMessages = () => {},
    }) {
      if (chatPathUuid && chatPathUuid === activeChatUuid) {
        const hasUnreadMessages = unreadMessages?.[chatPathUuid];

        if (hasUnreadMessages) {
          resetUnreadMessages();
        }
      }
    },
  },

  watch: {
    async room(newRoom, oldRoom) {
      const { room, roomId, rooms } = this;
      if (rooms.length > 0) {
        if (await this.shouldRedirect(newRoom)) return;

        if (!this.discussionId) {
          this.redirectToActiveChat({
            routeName: 'room',
            paramName: 'roomId',
            activeChatUuid: newRoom.uuid,
          });
        }

        if (newRoom.uuid !== oldRoom?.uuid) {
          this.isChatSkeletonActive = true;

          this.updateTextBoxMessage('');
          this.closeRoomContactInfo();

          if (!this.discussionId) {
            await this.$store.dispatch('chats/rooms/getCanUseCopilot');
            this.readMessages();
          }

          this.isChatSkeletonActive = false;
        }

        this.resetActiveChatUnreadMessages({
          chatPathUuid: roomId,
          activeChatUuid: room?.uuid,
          unreadMessages: rooms?.newMessagesByRoom,
          resetUnreadMessages: this.$store.dispatch('chats/rooms/resetNewMessagesByRoom', {
            room: roomId,
          }),
        });
      }
    },
    async rooms() {
      await this.setActiveRoom(this.roomId);
    },
    async discussion(newDiscussion) {
      const { discussion, discussionId, discussions } = this;

      if (this.discussions.length > 0) {
        if (await this.shouldRedirect(newDiscussion)) return;

        this.redirectToActiveChat({
          routeName: 'discussion',
          paramName: 'discussionId',
          activeChatUuid: newDiscussion.uuid,
        });

        this.resetActiveChatUnreadMessages({
          chatPathUuid: discussionId,
          activeChatUuid: discussion?.uuid,
          unreadMessages: discussions?.newMessagesByDiscussion,
          resetUnreadMessages: this.$store.dispatch(
            'chats/discussions/resetNewMessagesByDiscussion',
            {
              discussion: discussionId,
            },
          ),
        });
      }
    },
    async discussions() {
      await this.setActiveDiscussion(this.discussionId);
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
}

.get-chat-button {
  margin: auto $unnnic-spacing-inline-sm 0;
}
</style>
