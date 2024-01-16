<template>
  <section class="home-chat-modals">
    <modal-get-chat
      :showModal="modalsShowing.getChat"
      @closeModal="closeModal('getChat')"
      :title="$t('chats.get_chat_question')"
      :description="$t('chats.get_chat_confirmation', { contact: room?.contact?.name })"
      :whenGetChat="emitGotChat"
    />

    <unnnic-modal
      :text="$t('chats.your_chat_assumed', { contact: assumedChatContactName })"
      :description="$t('chats.your_chat_assumed_description', { contact: assumedChatContactName })"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="modalsShowing.assumedChat"
      @close="closeModal('assumedChat')"
    />

    <modal-close-chat
      v-if="modalsShowing.closeChat"
      @close="closeModal('closeChat')"
      :room="room"
    />

    <file-uploader
      v-model="modalFileUploaderFiles"
      ref="fileUploader"
      @progress="emitFileUploaderProgress"
    />
  </section>
</template>

<script>
import { mapState } from 'vuex';

import FileUploader from '@/components/chats/MessageManager/FileUploader';
import ModalGetChat from '@/components/chats/chat/ModalGetChat';

import ModalCloseChat from './ModalCloseChat.vue';

export default {
  name: 'HomeChatModals',

  components: {
    FileUploader,
    ModalGetChat,
    ModalCloseChat,
  },

  data() {
    return {
      modalsShowing: {
        getChat: false,
        assumedChat: false,
        closeChat: false,
        fileUploader: false,
      },

      modalFileUploaderFiles: [],
    };
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      showModalAssumedChat: ({ dashboard }) => dashboard.showModalAssumedChat,
      assumedChatContactName: ({ dashboard }) => dashboard.assumedChatContactName,
    }),
  },

  methods: {
    toggleModal(modalName, action = 'close') {
      if (this.modalsShowing[modalName] === undefined) {
        console.error(`Modal '${modalName}' does not exist.`);
      }

      this.modalsShowing[modalName] = action === 'open';
    },
    openModal(modalName, files) {
      this.toggleModal(modalName, 'open');

      if (files?.length > 0) {
        this.modalFileUploaderFiles = [...files];
      }
    },
    closeModal(modalName) {
      this.toggleModal(modalName, 'close');
    },

    emitGotChat() {
      this.$emit('got-chat');
    },
    emitFileUploaderProgress(progress) {
      this.$emit('file-uploader-progress', progress);
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