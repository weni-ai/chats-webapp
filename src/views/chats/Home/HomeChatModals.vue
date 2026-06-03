<template>
  <section
    class="home-chat-modals"
    :class="{ 'home-chat-modals--mobile': isMobile }"
  >
    <ModalGetChat
      data-testid="modal-get-chat"
      :showModal="modalsShowing.getChat"
      :title="$t('chats.get_chat_question')"
      :description="
        $t('chats.get_chat_confirmation', { contact: room?.contact?.name })
      "
      :whenGetChat="emitGotChat"
      @close-modal="closeModal('getChat')"
    />

    <HomeChatTakeoverRoom
      v-if="enableChatTakeoverFeedbackModal && showModalAssumedChat"
      v-model="showModalAssumedChat"
      :title="modalAssumedTitle"
      :description="modalAssumedText"
      @close="closeModalTakeoverRoom"
    />

    <ModalCloseChat
      v-if="modalsShowing.closeChat"
      v-model="modalsShowing.closeChat"
      data-testid="modal-close-chat"
      :room="room"
      @close="closeModal('closeChat')"
    />
  </section>
</template>

<script>
import { mapState, mapWritableState } from 'pinia';
import isMobile from 'is-mobile';

import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import HomeChatTakeoverRoom from './HomeChatTakeoverRoom.vue';
import ModalCloseChat from './ModalCloseChat.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDashboard } from '@/store/modules/dashboard';

export default {
  name: 'HomeChatModals',

  components: {
    ModalGetChat,
    ModalCloseChat,
    HomeChatTakeoverRoom,
  },
  emits: ['got-chat', 'select-quick-message'],

  data() {
    return {
      isMobile: isMobile(),

      modalsShowing: {
        getChat: false,
        closeChat: false,
      },
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapWritableState(useDashboard, [
      'showModalAssumedChat',
      'modalAssumedText',
      'modalAssumedTitle',
    ]),
    enableChatTakeoverFeedbackModal() {
      return this.featureFlags.active_features?.includes(
        'weniChatsChatTakeoverFeedbackModal',
      );
    },
  },

  methods: {
    toggleModal(modalName, action = 'close') {
      if (this.modalsShowing[modalName] === undefined) {
        console.error(`Modal '${modalName}' does not exist.`);
      }

      this.modalsShowing[modalName] = action === 'open';
    },
    openModal(modalName) {
      this.toggleModal(modalName, 'open');
    },
    closeModal(modalName) {
      this.toggleModal(modalName, 'close');
    },

    closeModalTakeoverRoom() {
      this.showModalAssumedChat = false;
      this.modalAssumedText = '';
      this.modalAssumedTitle = '';
    },

    emitGotChat() {
      this.$emit('got-chat');
    },
  },
};
</script>
<style lang="scss" scoped>
.home-chat-modals {
  &--mobile {
    position: absolute;
  }
}
</style>
