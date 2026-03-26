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
      @close="closeModalTakeoverRoom"
    />

    <ModalCloseChat
      v-if="modalsShowing.closeChat"
      v-model="modalsShowing.closeChat"
      data-testid="modal-close-chat"
      :room="room"
      @close="closeModal('closeChat')"
    />

    <FileUploader
      v-if="!enableMessageManagerV2"
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
import HomeChatTakeoverRoom from './HomeChatTakeoverRoom.vue';

import ModalCloseChat from './ModalCloseChat.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export default {
  name: 'HomeChatModals',

  components: {
    FileUploader,
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
        fileUploader: false,
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
    ]),
    ...mapWritableState(useMessageManager, {
      modalFileUploaderFiles: 'mediaUploadFiles',
    }),
    enableMessageManagerV2() {
      return this.featureFlags.active_features?.includes(
        'weniChatsInputMessageV2',
      );
    },
  },

  watch: {
    'modalsShowing.fileUploader': {
      handler(newModalsShowingFileUploader) {
        if (newModalsShowingFileUploader && !this.enableMessageManagerV2) {
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

    closeModalTakeoverRoom() {
      this.showModalAssumedChat = false;
      this.assumedChatContactName = '';
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
