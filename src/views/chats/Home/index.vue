<template>
  <ChatsLayout
    ref="chats-layout"
    :class="['home-chats-layout', { 'has-discussion': !!discussion }]"
    data-testid="chats-layout"
    @show-quick-messages="showQuickMessages = true"
  >
    <ChatsBackground
      v-if="!room?.uuid && !discussion?.uuid && !isChatSkeletonActive"
      data-testid="chats-background"
    />

    <HomeChat
      v-show="room?.uuid || discussion?.uuid"
      ref="home-chat"
      data-testid="home-chat"
      @open-room-contact-info="openRoomContactInfo"
      @close-room-contact-info="closeRoomContactInfo"
      @handle-show-quick-messages="showQuickMessages = true"
      @open-flows-trigger="openFlowsTrigger()"
    />

    <template #aside>
      <SearchMessages
        v-if="showSearchMessagesDrawer"
        @close="showSearchMessagesDrawer = false"
      />
      <QuickMessages
        v-else-if="showQuickMessages"
        @select-quick-message="
          (quickMessage) => updateTextBoxMessage(quickMessage.text)
        "
        @close="showQuickMessages = false"
      />
      <ContactInfo
        v-else-if="room && isRoomContactInfoOpen && !discussion"
        :key="room.uuid"
        data-testid="contact-info"
        @close="closeRoomContactInfo"
      />
      <DiscussionSidebar
        v-if="discussion"
        data-testid="discussion-sidebar"
      />
    </template>

    <ModalFeedback
      v-if="isRenderFeedbackModal"
      v-model="isRenderFeedbackModal"
      data-testid="modal-feedback"
      @close="handleCloseFeedbackModal"
    />
  </ChatsLayout>
</template>

<script>
import { mapState, mapActions, mapWritableState } from 'pinia';
import { useFeedback } from '@/store/modules/feedback';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import { resetChats } from '@/utils/chats';

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';
import ChatsBackground from '@/layouts/ChatsLayout/components/ChatsBackground/index.vue';

import DiscussionSidebar from '@/components/chats/DiscussionSidebar/index.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import ModalFeedback from './ModalFeedback.vue';
import QuickMessages from '@/components/chats/QuickMessages/index.vue';
import SearchMessages from '@/components/chats/SearchMessages/index.vue';

import HomeChat from './HomeChat.vue';

import { moduleStorage } from '@/utils/storage';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default {
  name: 'ViewHome',

  components: {
    ChatsLayout,
    ChatsBackground,
    ContactInfo,
    DiscussionSidebar,
    HomeChat,
    ModalFeedback,
    QuickMessages,
    SearchMessages,
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
      showQuickMessages: false,
      isRoomContactInfoOpen: moduleStorage.getItem(
        'isRoomContactInfoOpen',
        true,
      ),
      textBoxMessage: '',
      uploadFilesProgress: undefined,
      isChatSkeletonActive: false,
      tempJoinedDiscussions: [],
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useFeedback, {
      isRenderFeedbackModal: (store) => store.isRenderFeedbackModal,
    }),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapWritableState(useRoomMessages, ['showSearchMessagesDrawer']),
  },

  watch: {
    showSearchMessagesDrawer(val) {
      if (val) this.showQuickMessages = false;
    },
    showQuickMessages(val) {
      if (val) this.showSearchMessagesDrawer = false;
    },
    isRoomContactInfoOpen(val) {
      moduleStorage.setItem('isRoomContactInfoOpen', val);
    },
  },

  async created() {
    if (this.$route.name === 'home') {
      resetChats();
    }
  },

  methods: {
    ...mapActions(useFeedback, ['setIsRenderFeedbackModal']),
    openRoomContactInfo() {
      this.isRoomContactInfoOpen = true;
    },
    closeRoomContactInfo() {
      this.isRoomContactInfoOpen = false;
    },
    openFlowsTrigger() {
      this.$refs['chats-layout']?.openFlowsTrigger({
        contact: this.room?.contact,
      });
    },
    updateTextBoxMessage(message) {
      this.$refs['home-chat']?.updateTextBoxMessage(message);
    },
    handleCloseFeedbackModal() {
      this.setIsRenderFeedbackModal(false);
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
