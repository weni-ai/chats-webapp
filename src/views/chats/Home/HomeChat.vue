<template>
  <section class="home-chat">
    <HomeChatHeaders
      data-testid="home-chat-headers"
      :isLoading="isChatSkeletonActive"
      @open-room-contact-info="emitOpenRoomContactInfo"
      @open-modal-close-chat="openModal('closeChat')"
      @open-flows-trigger="emitOpenFlowsTrigger"
      @back="clearActiveChats"
    />

    <ChatsDropzone
      :show="isRenderChatsDropzoneVisible"
      @open-file-uploader="openModalFileUploader"
    >
      <RoomMessages
        v-if="!!room && !discussion"
        showRoomSummary
        @open-room-contact-info="emitOpenRoomContactInfo"
      />

      <DiscussionMessages v-if="!!discussion" />

      <MessageManager
        v-if="isMessageManagerRoomVisible || isMessageManagerDiscussionVisible"
        v-model="textBoxMessage"
        :loadingFileValue="uploadFilesProgress"
        :showSkeletonLoading="isChatSkeletonActive"
        data-testid="message-manager"
        @show-quick-messages="handleShowQuickMessages"
        @open-file-uploader="openModalFileUploader"
      />
    </ChatsDropzone>

    <UnnnicButton
      v-if="!room?.user && !discussion"
      class="get-chat-button"
      :text="$t('chats.get_chat')"
      type="primary"
      data-testid="get-chat-button"
      @click="openModal('getChat')"
    />

    <ButtonJoinDiscussion
      v-if="discussion"
      v-show="!isMessageManagerDiscussionVisible"
      data-testid="join-discussion"
      @join="whenJoinDiscussion"
    />

    <HomeChatModals
      ref="home-chat-modals"
      data-testid="home-chat-modals"
      @got-chat="emitCloseRoomContactInfo()"
      @file-uploader-progress="setUploadFilesProgress"
      @select-quick-message="updateTextBoxMessage($event?.text)"
    />
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useProfile } from '@/store/modules/profile';

import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone/index.vue';

import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages.vue';
import MessageManager from '@/components/chats/MessageManager/index.vue';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion.vue';

import Room from '@/services/api/resources/chats/room';
import { parseUrn } from '@/utils/room';

import HomeChatHeaders from './HomeChatHeaders.vue';
import HomeChatModals from './HomeChatModals.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';

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
  emits: [
    'open-room-contact-info',
    'close-room-contact-info',
    'handle-show-quick-messages',
    'open-flows-trigger',
  ],

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
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      rooms: 'rooms',
      getRoomById: 'getRoomById',
      isCanSendMessageActiveRoom: 'isCanSendMessageActiveRoom',
      isLoadingCanSendMessageStatus: 'isLoadingCanSendMessageStatus',
    }),
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
      discussions: 'discussions',
      getDiscussionById: 'getDiscussionById',
    }),
    isActiveFeatureIs24hValidOptimization() {
      return this.featureFlags.active_features?.includes(
        'weniChatsIs24hValidOptimization',
      );
    },
    isCanSendMessage() {
      return this.isActiveFeatureIs24hValidOptimization
        ? this.isCanSendMessageActiveRoom && !this.isLoadingCanSendMessageStatus
        : this.room?.is_24h_valid;
    },
    isRenderChatsDropzoneVisible() {
      return (
        (!!this.room && this.room.user && this.isCanSendMessage) ||
        !!this.discussion
      );
    },
    isMessageManagerRoomVisible() {
      const { room } = this;

      return (
        room &&
        room.user &&
        room.is_active &&
        this.isCanSendMessage &&
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

  watch: {
    room: {
      immediate: true,
      async handler(newRoom, oldRoom) {
        const { room, pathRoomId, rooms } = this;
        if (
          newRoom &&
          newRoom.uuid !== oldRoom?.uuid &&
          parseUrn(newRoom).plataform === 'whatsapp' &&
          this.isActiveFeatureIs24hValidOptimization
        ) {
          this.setIsLoadingCanSendMessageStatus(true);
          try {
            const response = await Room.getCanSendMessageStatus(newRoom.uuid);
            const canSendMessageStatus = response.can_send_message;
            this.setIsCanSendMessageActiveRoom(canSendMessageStatus);
          } catch (error) {
            console.error('Error getting can send message status:', error);
          } finally {
            this.setIsLoadingCanSendMessageStatus(false);
          }
        }

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

            if (!this.pathDiscussionId) {
              await this.getCanUseCopilot();
              this.readMessages();
            }

            this.isChatSkeletonActive = false;
          }

          this.resetActiveChatUnreadMessages({
            chatPathUuid: pathRoomId,
            activeChatUuid: room?.uuid,
            unreadMessages: rooms?.newMessagesByRoom,
            resetUnreadMessages: this.resetNewMessagesByRoom({
              room: pathRoomId,
            }),
          });
        }
      },
    },
    async rooms() {
      await this.handlingSetActiveRoom(this.pathRoomId);
    },
    async discussion(newDiscussion) {
      const { discussion, pathDiscussionId, discussions } = this;

      if (this.discussions.length > 0) {
        if (await this.shouldRedirect(newDiscussion)) {
          return;
        }

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
          resetUnreadMessages: this.resetNewMessagesByDiscussion({
            discussion: pathDiscussionId,
          }),
        });
      }
    },
    async discussions() {
      await this.handlingSetActiveDiscussion(this.pathDiscussionId);
    },
  },

  methods: {
    ...mapActions(useRooms, [
      'setActiveRoom',
      'getCanUseCopilot',
      'resetNewMessagesByRoom',
      'setIsLoadingCanSendMessageStatus',
      'setIsCanSendMessageActiveRoom',
    ]),
    ...mapActions(useDiscussions, [
      'setActiveDiscussion',
      'resetNewMessagesByDiscussion',
    ]),
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

    async handlingSetActiveRoom(uuid) {
      if (this.pathRoomId !== this.room?.uuid) {
        const room = this.getRoomById(uuid);
        if (room) {
          this.setActiveRoom(room);
        }
      }
    },
    async readMessages() {
      const { room } = this;
      if (room && room.uuid && room.user && room.user.email === this.me.email) {
        await Room.updateReadMessages(room.uuid, true);
      }
    },

    async handlingSetActiveDiscussion(uuid) {
      if (
        this.pathDiscussionId &&
        this.pathDiscussionId !== this.discussion?.uuid
      ) {
        const discussion = this.getDiscussionById(uuid);
        if (discussion) {
          await this.setActiveDiscussion(discussion);
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
        await this.$router.replace({ name: 'home' });
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
      await this.setActiveDiscussion(null);
      await this.setActiveRoom(null);
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
