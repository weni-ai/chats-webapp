<template>
  <section class="home-chat-headers">
    <ChatHeaderLoading
      v-show="isLoading"
      data-testid="chat-header-loading"
    />
    <UnnnicChatsHeader
      v-show="isShowingRoomHeader"
      :title="headerRoomTitle"
      :avatarClick="emitOpenRoomContactInfo"
      :titleClick="emitOpenRoomContactInfo"
      :avatarName="room?.contact.name"
      :close="emitOpenModalCloseChat"
      :back="isMobile ? emitBack : null"
      data-testid="chat-header"
    />

    <UnnnicChatsHeader
      v-show="isShowingDiscussionHeader"
      class="home-chat-headers__discussion"
      :title="headerDiscussionTitle"
      :subtitle="headerDiscussionSubtitle"
      avatarIcon="forum"
      size="small"
      :back="isMobile ? emitBack : null"
      data-testid="discussion-header"
    />

    <ChatHeaderSendFlow
      v-if="isShowingSendFlowHeader"
      data-testid="chat-header-send-flow"
      @send-flow="emitOpenFlowsTrigger"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import isMobile from 'is-mobile';

import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';

import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow.vue';
import { formatContactName } from '@/utils/chats';

export default {
  name: 'HomeChatHeaders',

  components: {
    ChatHeaderLoading,
    ChatHeaderSendFlow,
  },

  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'openRoomContactInfo',
    'openModalCloseChat',
    'openFlowsTrigger',
    'back',
  ],

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),

    isMobile() {
      return isMobile();
    },

    isShowingRoomHeader() {
      const { room, discussion, isLoading } = this;
      return room && !discussion && !isLoading;
    },
    isShowingDiscussionHeader() {
      const { discussion, isLoading } = this;
      return discussion && !isLoading;
    },
    isShowingSendFlowHeader() {
      const { room, discussion, isLoading } = this;
      return room && !discussion && !room.is_24h_valid && !isLoading;
    },

    headerRoomTitle() {
      return formatContactName(this.room);
    },
    headerDiscussionTitle() {
      const { discussion } = this;
      return discussion?.subject || '';
    },
    headerDiscussionSubtitle() {
      const { discussion } = this;
      return `${this.$tc('discussions.title')} ${this.$t('about')} ${
        discussion?.contact
      }`;
    },
  },
  methods: {
    emitOpenRoomContactInfo() {
      this.$emit('openRoomContactInfo');
    },
    emitOpenModalCloseChat() {
      this.$emit('openModalCloseChat');
    },
    emitOpenFlowsTrigger() {
      this.$emit('openFlowsTrigger');
    },
    emitBack() {
      return this.$emit('back');
    },
  },
};
</script>

<style lang="scss" scoped>
.home-chat-headers {
  &__discussion {
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
</style>
