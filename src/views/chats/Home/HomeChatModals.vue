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

    <FileUploader
      ref="fileUploader"
      v-model="modalFileUploaderFiles"
      :mediasType="modalFileUploaderMediaType"
      data-testid="modal-file-uploader"
      @progress="emitFileUploaderProgress"
      @close="closeModal('fileUploader')"
      @update:model-value="modalFileUploaderFiles = $event"
    />
  </section>
</template>

<script>
import { mapState, mapWritableState } from 'pinia';
import isMobile from 'is-mobile';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDashboard } from '@/store/modules/dashboard';

import FileUploader from '@/components/chats/MessageManager/FileUploader.vue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';

import ModalCloseChat from './ModalCloseChat.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

export default {
  name: 'HomeChatModals',

  components: {
    FileUploader,
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
        fileUploader: false,
      },

      modalFileUploaderMediaType: '',
    };
  },

  computed: {
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapState(useDashboard, [
      'showModalAssumedChat',
      'assumedChatContactName',
    ]),
    ...mapWritableState(useMessageManager, {
      modalFileUploaderFiles: 'mediaUploadFiles',
    }),
  },

  watch: {
    'modalsShowing.fileUploader': {
      handler(newModalsShowingFileUploader) {
        if (newModalsShowingFileUploader) {
          this.$refs.fileUploader.open();
        }
      },
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

    configFileUploader({ files, filesType }) {
      if (files?.length > 0) {
        this.modalFileUploaderFiles = [...files];
      }
      if (filesType) {
        this.modalFileUploaderMediaType = filesType;
      }
    },

    emitGotChat() {
      this.$emit('got-chat');
    },
    emitFileUploaderProgress(progress) {
      this.$emit('file-uploader-progress', progress);
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
