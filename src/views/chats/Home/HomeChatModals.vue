<template>
  <section
    class="home-chat-modals"
    :class="{ 'home-chat-modals--mobile': isMobile }"
  >
    <ModalGetChat
      :showModal="modalsShowing.getChat"
      @closeModal="closeModal('getChat')"
      :title="$t('chats.get_chat_question')"
      :description="
        $t('chats.get_chat_confirmation', { contact: room?.contact?.name })
      "
      :whenGetChat="emitGotChat"
    />

    <UnnnicModal
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
    />

    <ModalCloseChat
      v-if="modalsShowing.closeChat"
      @close="closeModal('closeChat')"
      :room="room"
    />

    <FileUploader
      v-model="modalFileUploaderFiles"
      ref="fileUploader"
      @progress="emitFileUploaderProgress"
      @close="closeModal('fileUploader')"
      @update:modelValue="modalFileUploaderFiles = $event"
      :mediasType="modalFileUploaderMediaType"
    />

    <ModalQuickMessages
      v-if="modalsShowing.quickMessages"
      @close="closeModal('quickMessages')"
      @select-quick-message="emitSelectQuickMessage"
    />
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDashboard } from '@/store/modules/dashboard';

import FileUploader from '@/components/chats/MessageManager/FileUploader.vue';
import ModalGetChat from '@/components/chats/chat/ModalGetChat.vue';
import ModalQuickMessages from '@/components/chats/QuickMessages/ModalQuickMessages.vue';

import ModalCloseChat from './ModalCloseChat.vue';

export default {
  name: 'HomeChatModals',

  components: {
    FileUploader,
    ModalGetChat,
    ModalQuickMessages,
    ModalCloseChat,
  },

  data() {
    return {
      isMobile: isMobile(),

      modalsShowing: {
        getChat: false,
        assumedChat: false,
        closeChat: false,
        fileUploader: false,
        quickMessages: false,
      },

      modalFileUploaderFiles: [],
      modalFileUploaderMediaType: '',
    };
  },

  computed: {
    ...mapState(useRooms, { room: (store) => store.activeRoom }),
    ...mapState(useDashboard, [
      'showModalAssumedChat',
      'assumedChatContactName',
    ]),
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
    emitSelectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
      this.closeModal('quickMessages');
    },
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
};
</script>
<style lang="scss" scoped>
.home-chat-modals {
  &--mobile {
    position: absolute;
  }
}
</style>
