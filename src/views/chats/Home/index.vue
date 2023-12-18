<template>
  <home-mobile v-if="isMobile" />
  <chats-layout
    v-else
    ref="chats-layout"
    :class="['home-chats-layout', { 'has-discussion': !!discussion }]"
    @select-quick-message="(quickMessage) => updateTextBoxMessage(quickMessage.text)"
  >
    <chats-background v-if="!room && !discussion && !isChatSkeletonActive" />
    <home-chat
      v-show="!!room || !!discussion"
      ref="home-chat"
      @openRoomContactInfo="openRoomContactInfo"
      @closeRoomContactInfo="closeRoomContactInfo"
    />

    <template #aside>
      <contact-info
        v-if="room && isRoomContactInfoOpen && !discussion"
        @close="closeRoomContactInfo"
      />
      <discussion-sidebar v-if="discussion" />
    </template>
  </chats-layout>
</template>

<script>
import { mapState } from 'vuex';

import * as notifications from '@/utils/notifications';

import ChatsLayout from '@/layouts/ChatsLayout';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';

import DiscussionSidebar from '@/components/chats/DiscussionSidebar';
import ContactInfo from '@/components/chats/ContactInfo';

import HomeChat from './HomeChat';
import HomeMobile from './HomeMobile';

export default {
  name: 'ViewHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ContactInfo,
    DiscussionSidebar,
    HomeChat,
    HomeMobile,
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
      isMobile: (state) => state.config.isMobile,
      room: (state) => state.chats.rooms.activeRoom,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
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
    updateTextBoxMessage(message) {
      this.$refs['home-chat']?.updateTextBoxMessage(message);
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
</style>
