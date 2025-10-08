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
        :title="room.contact.name || ''"
        :avatarClick="() => handleModal('ContactInfo', 'open')"
        :titleClick="() => handleModal('ContactInfo', 'open')"
        :avatarName="room.contact.name"
        data-testid="room-chat-header"
      />
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
        v-if="
          featureFlags.active_features?.includes('weniChatsContactInfoV2') &&
          isContactInfoOpened
        "
        class="contact-info"
        isViewMode
        data-testid="contact-info"
        @close="handleModal('ContactInfo', 'close')"
      />
      <OldContactInfo
        v-else-if="isContactInfoOpened"
        class="contact-info"
        isViewMode
        @close="handleModal('ContactInfo', 'close')"
      />
    </template>
  </ChatsLayout>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDashboard } from '@/store/modules/dashboard';
import { useProfile } from '@/store/modules/profile';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';
import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground/index.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages.vue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion.vue';
import OldContactInfo from '@/components/chats/ContactInfo/oldContactInfo.vue';

import ViewModeHeader from './components/ViewModeHeader.vue';

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
    OldContactInfo,
  },

  data: () => ({
    isRoomSkeletonActive: false,
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
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
  },

  watch: {
    async room() {
      this.isContactInfoOpened = false;
    },
    rooms: {
      once: true,
      async handler() {
        const { room_uuid } = this.$route.query || {};
        if (room_uuid) {
          const activeRoom = this.rooms.find((room) => room.uuid === room_uuid);

          if (activeRoom) await this.setActiveRoom(activeRoom);

          this.$router.replace({ query: {} });
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
  },
};
</script>

<style lang="scss" scoped>
.view-mode {
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
