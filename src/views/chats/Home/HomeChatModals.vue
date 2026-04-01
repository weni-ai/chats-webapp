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
      v-if="showModalAssumedChat"
      v-model="showModalAssumedChat"
      :contactName="assumedChatContactName"
      :assumedByUser="assumedByUser"
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
import { mapActions, mapState, mapWritableState } from 'pinia';
import isMobile from 'is-mobile';

import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import HomeChatTakeoverRoom from './HomeChatTakeoverRoom.vue';
import ModalCloseChat from './ModalCloseChat.vue';

import { useMessageManager } from '@/store/modules/chats/messageManager';
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
  emits: ['got-chat', 'file-uploader-progress', 'select-quick-message'],

  data() {
    return {
      isMobile: isMobile(),

      modalsShowing: {
        getChat: false,
        closeChat: false,
      },

      modalFileUploaderMediaType: '',
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapWritableState(useDashboard, [
      'showModalAssumedChat',
      'assumedChatContactName',
      'assumedByUser',
    ]),
  },

  methods: {
    ...mapActions(useMessageManager, ['addMediaUploadFiles']),
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

    configFileUploader({ files, filesType }) {
      this.addMediaUploadFiles(files);
      if (filesType) {
        this.modalFileUploaderMediaType = filesType;
      }
    },

    closeModalTakeoverRoom() {
      this.showModalAssumedChat = false;
      this.assumedChatContactName = '';
      this.assumedByUser = '';
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
