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

    <!-- TODO: It will be prioritized and replaced by a new modal; currently, it is not falling into any viewing cycle. -->
    <!-- <UnnnicModal
      data-testid="modal-assume-chat"
      :text="$t('chats.your_chat_assumed', { contact: assumedChatContactName })"
      :description="
        $t('chats.your_chat_assumed_description', {
          contact: assumedChatContactName,
        })
      "
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="modalsShowing.assumedChat"
      @close="closeModal('assumedChat')"
    /> -->

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
import { mapActions, mapState } from 'pinia';
import isMobile from 'is-mobile';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDashboard } from '@/store/modules/dashboard';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useMessageManager } from '@/store/modules/chats/messageManager';

import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import ModalCloseChat from './ModalCloseChat.vue';

export default {
  name: 'HomeChatModals',

  components: {
    ModalGetChat,
    ModalCloseChat,
  },
  emits: ['got-chat', 'file-uploader-progress', 'select-quick-message'],

  data() {
    return {
      isMobile: isMobile(),

      modalsShowing: {
        getChat: false,
        assumedChat: false,
        closeChat: false,
      },

      modalFileUploaderMediaType: '',
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapState(useDashboard, [
      'showModalAssumedChat',
      'assumedChatContactName',
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
