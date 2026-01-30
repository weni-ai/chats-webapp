<template>
  <ChatSummary
    v-if="
      (!isLoadingMessages || silentLoadingMessages) &&
      openChatSummary &&
      showRoomSummary &&
      enableRoomSummary &&
      room
    "
    :isGeneratingSummary="isLoadingActiveRoomSummary"
    :summaryText="activeRoomSummary.summary"
    :feedback="activeRoomSummary.feedback"
    :skipAnimation="skipSummaryAnimation"
    :isArchived="room?.is_archived || false"
    :archivedUrl="room?.archived_url || ''"
    @close="openChatSummary = false"
  />
  <ChatMessages
    ref="activeChatMessages"
    :chatUuid="room?.uuid || ''"
    :messages="roomMessages"
    :messagesNext="roomMessagesNext || ''"
    :messagesPrevious="roomMessagesPrevious || ''"
    :messagesSorted="roomMessagesSorted"
    :messagesSendingUuids="roomMessagesSendingUuids"
    :messagesFailedUuids="roomMessagesFailedUuids"
    :resendMessages="roomResendMessages"
    :resendMedia="roomResendMedia"
    :isLoading="isLoadingMessages || isLoadingInternalNotes"
    :isClosedChat="!!room?.ended_at"
    :enableReply="false"
    @scroll-top="searchForMoreMessages"
    @open-room-contact-info="$emit('open-room-contact-info')"
  />
</template>
<script>
import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';
import ChatSummary from '@/layouts/ChatsLayout/components/ChatSummary/index.vue';

import RoomService from '@/services/api/resources/chats/room';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

import { SEE_ALL_INTERNAL_NOTES_CHIP_CONTENT } from '@/utils/chats';
import i18n from '@/plugins/i18n';

export default {
  name: 'RoomMessages',

  components: { ChatMessages, ChatSummary },

  props: {
    showRoomSummary: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['open-room-contact-info'],

  data: () => {
    return {
      page: 0,
      limit: 20,
      isLoadingInternalNotes: false,
      isLoadingMessages: true,
      silentLoadingMessages: false,
      isLoadingSummary: false,
      getRoomSummaryInterval: null,
      skipSummaryAnimation: false,
    };
  },

  computed: {
    ...mapWritableState(useRooms, [
      'activeRoomSummary',
      'isLoadingActiveRoomSummary',
      'roomsSummary',
      'openActiveRoomSummary',
      'isCanSendMessageActiveRoom',
      'isLoadingCanSendMessageStatus',
    ]),
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      openChatSummary: (store) => store.openActiveRoomSummary,
      isClosedRoom: (store) => !!store.activeRoom?.ended_at,
    }),
    ...mapState(useRoomMessages, [
      'roomMessages',
      'roomMessagesNext',
      'roomMessagesPrevious',
      'roomMessagesSorted',
      'roomMessagesSendingUuids',
      'roomMessagesFailedUuids',
    ]),
    ...mapWritableState(useRoomMessages, ['roomInternalNotes']),
    ...mapState(useConfig, {
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
    }),
  },

  watch: {
    'room.uuid': {
      immediate: true,
      async handler(roomUuid) {
        clearInterval(this.getRoomSummaryInterval);
        if (roomUuid) {
          this.resetRoomMessages();
          this.page = 0;
          this.isLoadingMessages = true;
          try {
            await this.handlingGetRoomMessages();
            await this.getRoomInternalNotes();
          } catch (error) {
            console.error(error);
          } finally {
            this.isLoadingMessages = false;
          }

          if (this.enableRoomSummary) {
            const isActiveFeatureIs24hValidOptimization =
              this.featureFlags.active_features?.includes(
                'weniChatsIs24hValidOptimization',
              );

            const isCanSendMessage = isActiveFeatureIs24hValidOptimization
              ? this.isCanSendMessageActiveRoom &&
                !this.isLoadingCanSendMessageStatus
              : this.room?.is_24h_valid;

            this.openActiveRoomSummary = this.isClosedRoom || isCanSendMessage;
            this.skipSummaryAnimation = false;
            this.handlingGetRoomSummary();
          }
        }
      },
    },
  },

  methods: {
    ...mapActions(useRoomMessages, {
      roomResendMessages: 'resendRoomMessages',
      roomResendMedia: 'resendRoomMedia',
      getRoomMessages: 'getRoomMessages',
      resetRoomMessages: 'resetRoomMessages',
      addSortedMessage: 'addRoomMessageSorted',
    }),

    async handlingGetRoomMessages() {
      try {
        await this.getRoomMessages();
      } catch (error) {
        console.error(error);
      } finally {
        this.silentLoadingMessages = false;
      }
    },

    setRoomSummary(text, feedback, status) {
      this.isLoadingActiveRoomSummary = false;
      if (this.room) {
        this.roomsSummary[this.room.uuid] = {
          summary: text,
          feedback,
          status,
        };
      }
      clearInterval(this.getRoomSummaryInterval);
    },

    async getRoomSummary() {
      if (!this.room) return;
      try {
        const { status, summary, feedback } = await RoomService.getSummary({
          roomUuid: this.room.uuid,
        });
        if (['DONE', 'UNAVAILABLE'].includes(status)) {
          const unavailableText = this.$t('chats.summary.unavailable');
          this.setRoomSummary(
            status === 'UNAVAILABLE' ? unavailableText : summary,
            feedback,
            status,
          );
        }
      } catch (error) {
        console.log(error);
        const errorText = i18n.global.t('chats.summary.error');
        this.setRoomSummary(errorText);
      }
    },

    async getRoomInternalNotes() {
      try {
        const lastSystemMessage = this.roomMessages.findLast(
          (message) => !message.user && !message.contact,
        );

        if (!lastSystemMessage) return;

        this.isLoadingInternalNotes = true;

        const { results } = await RoomNotes.getInternalNotes({
          room: this.room.uuid,
          limit: 1,
        });

        const hasInternalNotes = results.length > 0;

        if (hasInternalNotes && !this.room.ended_at && this.room.user) {
          const chipNote = {
            uuid: new Date().toString(),
            created_on: lastSystemMessage.created_on,
            text: SEE_ALL_INTERNAL_NOTES_CHIP_CONTENT,
          };
          this.addSortedMessage({
            message: chipNote,
            reorderMessageMinute: true,
          });
          this.$refs['activeChatMessages'].scrollToInternalNote(chipNote);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoadingInternalNotes = false;
      }
    },

    handlingGetRoomSummary() {
      if (!this.roomsSummary[this.room?.uuid]) {
        this.isLoadingActiveRoomSummary = true;
        this.getRoomSummary();
        this.getRoomSummaryInterval = setInterval(this.getRoomSummary, 5000);
      } else {
        this.skipSummaryAnimation = true;
      }
    },

    searchForMoreMessages() {
      if (this.roomMessagesNext) {
        this.page += 1;
        this.silentLoadingMessages = true;
        this.handlingGetRoomMessages();
      }
    },
  },
};
</script>
