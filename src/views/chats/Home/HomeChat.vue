<template>
  <section class="home-chat">
    <HomeChatHeaders
      :isLoading="isChatSkeletonActive"
      @openRoomContactInfo="emitOpenRoomContactInfo"
      @openModalCloseChat="openModal('closeChat')"
      @openFlowsTrigger="emitOpenFlowsTrigger"
      @back="clearActiveChats"
    />
    <ChatsDropzone
      @open-file-uploader="openModalFileUploader"
      :show="(!!room && room.user && room.is_24h_valid) || !!discussion"
    >
      <RoomMessages v-if="!!room && !discussion" />
      <DiscussionMessages v-if="!!discussion" />

      <MessageManager
        v-if="isMessageManagerRoomVisible || isMessageManagerDiscussionVisible"
        v-model="textBoxMessage"
        :loadingFileValue="uploadFilesProgress"
        :showSkeletonLoading="isChatSkeletonActive"
        @show-quick-messages="handleShowQuickMessages"
        @open-file-uploader="openModalFileUploader"
      />
    </ChatsDropzone>

    <UnnnicButton
      v-if="!room?.user && !discussion"
      class="get-chat-button"
      :text="$t('chats.get_chat')"
      type="primary"
      @click="openModal('getChat')"
    />

    <ButtonJoinDiscussion
      v-if="discussion"
      v-show="!isMessageManagerDiscussionVisible"
      @join="whenJoinDiscussion"
    />

    <HomeChatModals
      ref="home-chat-modals"
      @got-chat="emitCloseRoomContactInfo"
      @file-uploader-progress="setUploadFilesProgress"
      @select-quick-message="updateTextBoxMessage($event?.text)"
    />
  </section>
</template>

<script>
import isMobile from 'is-mobile';
import { mapState } from 'vuex';

import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';

import RoomMessages from '@/components/chats/chat/RoomMessages';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages';
import MessageManager from '@/components/chats/MessageManager';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion';

import Room from '@/services/api/resources/chats/room';

import HomeChatHeaders from './HomeChatHeaders.vue';
import HomeChatModals from './HomeChatModals.vue';

export default {
  name: 'HomeChat',

  components: {
    ChatsDropzone,
    HomeChatHeaders,
    RoomMessages,
    DiscussionMessages,
    MessageManager,
    ButtonJoinDiscussion,
    HomeChatModals,
  },

  data() {
    return {
      isMobile: isMobile(),

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
    pathRoomId() {
      return this.$route.params.roomId;
    },
    pathDiscussionId() {
      return this.$route.params.discussionId;
    },
  },

  methods: {
    openModal(modalName) {
      this.$refs['home-chat-modals'].openModal(modalName);
    },
    openModalFileUploader(files, filesType) {
      const homeChatModals = this.$refs['home-chat-modals'];
      homeChatModals.configFileUploader({ files, filesType });
      homeChatModals.openModal('fileUploader');
    },
    emitOpenRoomContactInfo() {
      this.$emit('open-room-contact-info');
    },
    emitCloseRoomContactInfo() {
      this.$emit('close-room-contact-info');
    },
    emitHandleShowQuickMessages() {
      this.$emit('handle-show-quick-messages');
    },
    emitOpenFlowsTrigger() {
      this.$emit('open-flows-trigger');
    },
    handleShowModalQuickMessages() {
      this.showModalQuickMessages = !this.showModalQuickMessages;
    },
    handleShowQuickMessages() {
      if (this.isMobile) {
        this.openModal('quickMessages');
        return;
      }

      this.emitHandleShowQuickMessages();
    },

    updateTextBoxMessage(message) {
      this.textBoxMessage = message;
    },
    setUploadFilesProgress(progress) {
      this.uploadFilesProgress = progress;
    },

    async setActiveRoom(uuid) {
      if (this.pathRoomId !== this.room?.uuid) {
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
      if (
        this.pathDiscussionId &&
        this.pathDiscussionId !== this.discussion?.uuid
      ) {
        const discussion =
          this.$store.getters['chats/discussions/getDiscussionById'](uuid);
        if (discussion) {
          await this.$store.dispatch(
            'chats/discussions/setActiveDiscussion',
            discussion,
          );
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
      return (
        (await this.redirectIfNoChat(activeChat)) ||
        !this.isValidChat(activeChat)
      );
    },
    async redirectToActiveChat({
      routeName,
      paramName,
      activeChatUuid,
      pathChatUuid,
    }) {
      if (activeChatUuid !== pathChatUuid) {
        this.$router[this.isMobile ? 'push' : 'replace']({
          name: routeName,
          params: { [paramName]: activeChatUuid },
        });
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

    async clearActiveChats() {
      const { dispatch } = this.$store;

      await dispatch('chats/discussions/setActiveDiscussion', null);
      await dispatch('chats/rooms/setActiveRoom', null);
    },
  },

  watch: {
    room: {
      immediate: true,
      async handler(newRoom, oldRoom) {
        const { room, pathRoomId, rooms } = this;
        if (rooms.length > 0) {
          if (await this.shouldRedirect(newRoom)) return;

          if (!this.pathDiscussionId) {
            this.redirectToActiveChat({
              routeName: 'room',
              paramName: 'roomId',
              activeChatUuid: newRoom.uuid,
              pathChatUuid: this.pathRoomId,
            });
          }

          if (newRoom.uuid !== oldRoom?.uuid) {
            this.isChatSkeletonActive = true;

            this.updateTextBoxMessage('');
            this.emitCloseRoomContactInfo();

            if (!this.pathDiscussionId) {
              await this.$store.dispatch('chats/rooms/getCanUseCopilot');
              this.readMessages();
            }

            this.isChatSkeletonActive = false;
          }

          this.resetActiveChatUnreadMessages({
            chatPathUuid: pathRoomId,
            activeChatUuid: room?.uuid,
            unreadMessages: rooms?.newMessagesByRoom,
            resetUnreadMessages: this.$store.dispatch(
              'chats/rooms/resetNewMessagesByRoom',
              {
                room: pathRoomId,
              },
            ),
          });
        }
      },
    },
    async rooms() {
      await this.setActiveRoom(this.pathRoomId);
    },
    async discussion(newDiscussion) {
      const { discussion, pathDiscussionId, discussions } = this;

      if (this.discussions.length > 0) {
        if (await this.shouldRedirect(newDiscussion)) return;

        this.redirectToActiveChat({
          routeName: 'discussion',
          paramName: 'discussionId',
          activeChatUuid: newDiscussion.uuid,
          pathChatUuid: this.pathDiscussionId,
        });

        this.resetActiveChatUnreadMessages({
          chatPathUuid: pathDiscussionId,
          activeChatUuid: discussion?.uuid,
          unreadMessages: discussions?.newMessagesByDiscussion,
          resetUnreadMessages: this.$store.dispatch(
            'chats/discussions/resetNewMessagesByDiscussion',
            {
              discussion: pathDiscussionId,
            },
          ),
        });
      }
    },
    async discussions() {
      await this.setActiveDiscussion(this.pathDiscussionId);
    },
  },
};
</script>

<style lang="scss" scoped>
.home-chat {
  padding-bottom: $unnnic-spacing-xs;

  display: flex;
  flex-direction: column;

  height: 100%;
  max-height: 100vh;

  .get-chat-button {
    margin: auto $unnnic-spacing-inline-sm 0;
  }
}
</style>
