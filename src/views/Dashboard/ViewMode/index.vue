<template>
  <ChatsLayout
    v-if="viewedAgent.email"
    :viewedAgent="viewedAgent.email"
    data-testid="chats-layout"
  >
    <ViewModeHeader
      :viewedAgent="viewedAgent.name"
      data-testid="view-mode-header"
    />

    <ChatsBackground
      v-if="!room && !discussion && !isRoomSkeletonActive"
      data-testid="chats-background"
    />
    <section
      v-if="!!room || !!discussion"
      v-show="!isRoomSkeletonActive"
      class="view-mode__active-chat"
      data-testid="active-chat-section"
    >
      <ChatHeaderLoading
        v-show="isRoomSkeletonActive"
        data-testid="chat-header-loading"
      />
      <UnnnicChatsHeader
        v-show="!isRoomSkeletonActive"
        v-if="!!room && !discussion"
        :title="room.contact.name || `[${$t('unnamed_contact')}]`"
        :avatarClick="() => handleModal('ContactInfo', 'open')"
        :titleClick="() => handleModal('ContactInfo', 'open')"
        :avatarName="room.contact.name || '-'"
        data-testid="room-chat-header"
      >
        <template #right>
          <section class="view-mode__contact-actions">
            <UnnnicToolTip
              v-if="enableRoomSummary"
              enabled
              :text="
                openActiveRoomSummary
                  ? $t('chats.summary.close_summary_tooltip')
                  : $t('chats.summary.open_summary_tooltip')
              "
              side="left"
              class="view-mode__summary-icon-tooltip"
            >
              <section
                class="view-mode__summary-icon"
                :class="{
                  'view-mode__summary-icon--open': openActiveRoomSummary,
                }"
              >
                <UnnnicIcon
                  icon="bi:stars"
                  clickable
                  :scheme="openActiveRoomSummary ? 'gray-900' : 'gray-500'"
                  size="ant"
                  @click="openActiveRoomSummary = !openActiveRoomSummary"
                />
              </section>
            </UnnnicToolTip>
            <UnnnicToolTip
              v-if="
                featureFlags.active_features?.includes('weniChatsContactInfoV2')
              "
              enabled
              :text="
                room?.has_history
                  ? $t('contact_info.see_contact_history')
                  : $t('contact_info.no_contact_history')
              "
              side="left"
            >
              <UnnnicIcon
                icon="history"
                size="ant"
                :clickable="room?.has_history"
                :scheme="room?.has_history ? 'neutral-cloudy' : 'neutral-soft'"
                @click="openHistory"
              />
            </UnnnicToolTip>
            <UnnnicToolTip
              v-if="
                featureFlags.active_features?.includes('weniChatsContactInfoV2')
              "
              enabled
              :text="$tc('transfer_contact', 1)"
              side="left"
            >
              <UnnnicIcon
                icon="sync_alt"
                size="ant"
                clickable
                scheme="neutral-cloudy"
                @click="openTransferModal"
              />
            </UnnnicToolTip>
          </section>
        </template>
      </UnnnicChatsHeader>

      <UnnnicChatsHeader
        v-show="!isRoomSkeletonActive"
        v-if="!!discussion"
        class="discussion-header"
        :title="discussion.subject"
        :subtitle="`${$tc('discussions.title')} ${$t('about')} ${
          discussion.contact
        }`"
        avatarIcon="forum"
        size="small"
        data-testid="discussion-chat-header"
      />

      <RoomMessages
        v-if="!!room && !discussion"
        data-testid="room-messages"
        showRoomSummary
        @open-room-contact-info="isContactInfoOpened = true"
      />
      <DiscussionMessages
        v-if="!!discussion"
        data-testid="discussion-messages"
      />
      <UnnnicButton
        v-if="room && !discussion && room.user?.email !== me.email"
        class="assume-chat"
        :text="$t('dashboard.view-mode.assume_chat')"
        type="secondary"
        data-testid="assume-chat-button"
        @click="handleModal('AssumeChatConfirmation', 'open')"
      />
      <ButtonJoinDiscussion
        v-if="!!discussion"
        data-testid="join-discussion-button"
        @click="whenJoinDiscussion"
      />
    </section>

    <ModalGetChat
      :showModal="isAssumeChatConfirmationOpened"
      :title="$t('dashboard.view-mode.assume_chat_question')"
      :description="
        $t('dashboard.view-mode.assume_chat_confirmation', {
          agent: viewedAgent.name,
        })
      "
      :whenGetChat="whenGetChat"
      data-testid="modal-get-chat"
      @close-modal="handleModal('AssumeChatConfirmation', 'close')"
    />

    <template #aside>
      <ContactInfo
        v-if="isContactInfoOpened && room"
        :key="room.uuid"
        class="contact-info"
        isViewMode
        data-testid="contact-info"
        @close="handleModal('ContactInfo', 'close')"
      />
    </template>

    <ModalTransferRooms
      v-if="isModalTransferRoomsOpened"
      @close="closeTransferModal()"
    />
  </ChatsLayout>
</template>

<script>
import { mapActions, mapState, mapWritableState } from 'pinia';
import { format as dateFnsFormat, subYears as dateFnsSubYears } from 'date-fns';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDashboard } from '@/store/modules/dashboard';
import { useProfile } from '@/store/modules/profile';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useConfig } from '@/store/modules/config';

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';
import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground/index.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages.vue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion.vue';
import ModalTransferRooms from '@/components/chats/chat/ModalTransferRooms.vue';
import ViewModeHeader from './components/ViewModeHeader.vue';

import { parseUrn } from '@/utils/room';

export default {
  name: 'ViewMode',

  components: {
    ChatsBackground,
    ChatsLayout,
    ChatHeaderLoading,
    ContactInfo,
    RoomMessages,
    DiscussionMessages,
    ViewModeHeader,
    ModalGetChat,
    ButtonJoinDiscussion,

    ModalTransferRooms,
  },

  data: () => ({
    isRoomSkeletonActive: false,
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
    isModalTransferRoomsOpened: false,
  }),

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      rooms: (store) => store.rooms,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapState(useProfile, ['me']),
    ...mapState(useDashboard, ['viewedAgent']),
    ...mapState(useRoomMessages, ['roomMessagesNext']),
    ...mapWritableState(useRooms, [
      'contactToTransfer',
      'openActiveRoomSummary',
    ]),
    ...mapState(useConfig, {
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
    }),
  },

  watch: {
    room() {
      this.isContactInfoOpened = false;
    },
    rooms: {
      immediate: true,
      handler() {
        const { uuid_room } = this.$route.query || {};

        if (uuid_room && this.rooms?.length > 0) {
          const activeRoom = this.rooms.find((room) => room.uuid === uuid_room);

          if (activeRoom) {
            this.setActiveRoom(activeRoom);
            this.$router.replace({ query: {} });
          }
        }
      },
    },
  },

  beforeMount() {
    this.setActiveRoom(null);
    this.setActiveDiscussion(null);
  },

  methods: {
    ...mapActions(useDiscussions, ['setActiveDiscussion']),
    ...mapActions(useRooms, ['setActiveRoom']),
    ...mapActions(useDashboard, ['setViewedAgent']),

    handleModal(modalName, action) {
      const registeredModals = ['ContactInfo', 'AssumeChatConfirmation'];

      if (!registeredModals.includes(modalName)) {
        throw new Error(`Modal name '${modalName}' not found`);
      }

      const modalActionKey = `is${modalName}Opened`;

      const actionMap = {
        open: () => {
          this[modalActionKey] = true;
        },
        close: () => {
          this[modalActionKey] = false;
        },
      };

      if (!actionMap[action]) {
        throw new Error(`Modal handler '${action}' not found`);
      }

      actionMap[action]();
    },
    whenJoinDiscussion() {
      this.$router.push({
        name: 'discussion',
        params: { discussionId: this.discussion.uuid },
      });
    },
    whenGetChat() {
      this.setViewedAgent({
        email: '',
        name: '',
      });
      this.$router.push({ name: 'room', params: { roomId: this.room.uuid } });
    },
    openTransferModal() {
      this.contactToTransfer = this.room.uuid;
      this.isModalTransferRoomsOpened = true;
    },
    closeTransferModal() {
      this.contactToTransfer = '';
      this.isModalTransferRoomsOpened = false;
    },
    openHistory() {
      const { plataform, contactNum } = parseUrn(this.room);
      const protocol = this.room.protocol;
      const contactUrn =
        plataform === 'whatsapp' ? contactNum.replace('+', '') : contactNum;

      const A_YEAR_AGO = dateFnsFormat(
        dateFnsSubYears(new Date(), 1),
        'yyyy-MM-dd',
      );

      this.$router.push({
        name: 'closed-rooms',
        query: {
          contactUrn: contactUrn || this.room?.contact?.name,
          protocol,
          startDate: A_YEAR_AGO,
          from: this.room.uuid,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.view-mode {
  &__contact-actions {
    display: flex;
    gap: $unnnic-space-6;
    align-items: center;

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }
  &__summary-icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $unnnic-radius-2;

    &--open {
      background-color: $unnnic-color-purple-100;
      &::after {
        content: '';
        position: fixed;
        top: 106px; // This distance corresponds to the positioning of the summary balloon point.
        transform: rotate(-45deg);
        width: $unnnic-space-3;
        height: $unnnic-space-3;
        background-color: $unnnic-color-purple-100;
        border-radius: $unnnic-space-1;
      }
    }
  }
  &__active-chat {
    display: grid;
    grid-template-rows: auto 1fr auto;

    height: 100%;

    padding-bottom: $unnnic-spacing-xs;

    .chat-messages__container {
      padding-left: $unnnic-spacing-sm;
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

  .assume-chat {
    margin: $unnnic-spacing-nano $unnnic-spacing-inline-sm 0;
  }
}
</style>
