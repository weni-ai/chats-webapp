<template>
  <ChatsLayout
    v-if="viewedAgent.email"
    :viewedAgent="viewedAgent.email"
  >
    <ViewModeHeader :viewedAgent="viewedAgent.name" />

    <ChatsBackground v-if="!room && !discussion && !isRoomSkeletonActive" />
    <section
      v-if="!!room || !!discussion"
      v-show="!isRoomSkeletonActive"
      class="view-mode__active-chat"
    >
      <ChatHeaderLoading v-show="isRoomSkeletonActive" />
      <UnnnicChatsHeader
        v-show="!isRoomSkeletonActive"
        v-if="!!room && !discussion"
        :title="room.contact.name || ''"
        :avatarClick="() => handleModal('ContactInfo', 'open')"
        :titleClick="() => handleModal('ContactInfo', 'open')"
        :avatarName="room.contact.name"
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
      />

      <RoomMessages v-if="!!room && !discussion" />
      <DiscussionMessages v-if="!!discussion" />
      <UnnnicButton
        v-if="room && !discussion && room.user?.email !== me.email"
        class="assume-chat"
        :text="$t('dashboard.view-mode.assume_chat')"
        type="secondary"
        @click="handleModal('AssumeChatConfirmation', 'open')"
      />
      <ButtonJoinDiscussion
        v-if="!!discussion"
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
      @close-modal="handleModal('AssumeChatConfirmation', 'close')"
    />

    <template #aside>
      <ContactInfo
        v-if="isContactInfoOpened"
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

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';
import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground/index.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionMessages from '@/components/chats/chat/DiscussionMessages.vue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import ButtonJoinDiscussion from '@/components/chats/chat/ButtonJoinDiscussion.vue';

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
  },

  data: () => ({
    isRoomSkeletonActive: false,
    isContactInfoOpened: false,
    isAssumeChatConfirmationOpened: false,
  }),

  beforeMount() {
    this.setActiveRoom(null);
    this.setActiveDiscussion(null);
  },

  computed: {
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapState(useProfile, ['me']),
    ...mapState(useDashboard, ['viewedAgent']),
    ...mapState(useRoomMessages, ['roomMessagesNext']),
  },

  methods: {
    ...mapActions(useDiscussions, ['setActiveDiscussion']),
    ...mapActions(useRooms, ['setActiveRoom']),
    ...mapActions(useDashboard, ['getViewedAgentData', 'setViewedAgent']),

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
      this.$router.push({ name: 'room', params: { roomId: this.room.uuid } });
    },
  },

  watch: {
    async room() {
      this.isContactInfoOpened = false;
    },
    '$route.params.viewedAgent': {
      immediate: true,
      handler(newViewdAgentEmail) {
      if (newViewdAgentEmail) {
        this.getViewedAgentData(this.$route.params.viewedAgent);
      } else {
        this.setViewedAgent({ name: '', email: '' });
      }
    },
    }
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
