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
import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import { resetChats } from '@/utils/chats';

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground/index.vue';

import DiscussionSidebar from '@/components/chats/DiscussionSidebar/index.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';

import HomeChat from './HomeChat.vue';

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

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
  },

  async created() {
    if (this.$route.name === 'home') {
      resetChats();
    }
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
};
</script>

<style lang="scss" scoped>
.home-chats-layout {
  &.has-aside.has-discussion {
    grid-template-columns: 3fr 5.5fr 3.5fr;
  }
}
</style>
