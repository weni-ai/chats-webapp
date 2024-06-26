<template>
  <section class="home-chat-headers">
    <ChatHeaderLoading v-show="isLoading" />
    <UnnnicChatsHeader
      v-show="isShowingRoomHeader"
      :title="headerRoomTitle"
      :avatarClick="() => emitOpenRoomContactInfo()"
      :titleClick="() => emitOpenRoomContactInfo()"
      :avatarName="headerRoomTitle"
      :close="emitOpenModalCloseChat"
      :back="isMobile ? emitBack : null"
    />
    <UnnnicChatsHeader
      v-show="isShowingDiscussionHeader"
      class="home-chat-headers__discussion"
      :title="headerDiscussionTitle"
      :subtitle="headerDiscussionSubtitle"
      avatarIcon="forum"
      size="small"
      :back="isMobile ? emitBack : null"
    />

    <ChatHeaderSendFlow
      v-if="isShowingSendFlowHeader"
      @send-flow="emitOpenFlowsTrigger"
    />
  </section>
</template>

<script>
import { mapState } from 'vuex';
import isMobile from 'is-mobile';

import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';

import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow.vue';

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

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      discussion: (state) => state.chats.discussions.activeDiscussion,
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
      const { room } = this;
      return room?.contact?.name || '';
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
