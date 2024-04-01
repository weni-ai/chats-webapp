<template>
  <ChatsLayout
    ref="chats-layout"
    :class="['home-chats-layout', { 'has-discussion': !!discussion }]"
    @select-quick-message="
      (quickMessage) => updateTextBoxMessage(quickMessage.text)
    "
  >
    <ChatsBackground
      v-if="!room?.uuid && !discussion?.uuid && !isChatSkeletonActive"
    />
    <HomeChat
      v-show="room?.uuid || discussion?.uuid"
      ref="home-chat"
      @open-room-contact-info="openRoomContactInfo"
      @close-room-contact-info="closeRoomContactInfo"
      @handle-show-quick-messages="handlerShowQuickMessages"
      @open-flows-trigger="openFlowsTrigger"
    />

    <template #aside>
      <ContactInfo
        v-if="room && isRoomContactInfoOpen && !discussion"
        @close="closeRoomContactInfo"
      />
      <DiscussionSidebar v-if="discussion" />
    </template>
  </ChatsLayout>
</template>

<script>
import { mapState } from 'vuex';

import * as notifications from '@/utils/notifications';
import { resetChats } from '@/utils/chats';

import ChatsLayout from '@/layouts/ChatsLayout';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground';

import DiscussionSidebar from '@/components/chats/DiscussionSidebar';
import ContactInfo from '@/components/chats/ContactInfo';

import HomeChat from './HomeChat';

export default {
  name: 'ViewHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ContactInfo,
    DiscussionSidebar,
    HomeChat,
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

  async created() {
    if (this.$route.name === 'home') {
      resetChats();
    }
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
  },

  methods: {
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
      this.$refs['chats-layout']?.openFlowsTrigger({
        contact: this.room?.contact,
      });
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
