<template>
  <section v-if="isMobile && showUploadModal">
    <UnnnicModal
      v-if="modelValue.length > 0"
      class="modal-upload-confirm"
      :text="$t('confirm_send')"
      @close="closeFileUploadModal"
    >
      <UnnnicImportCard
        v-for="file in modelValue"
        :key="file.name + file.lastModified"
        :title="file.name"
        :isImporting="false"
        :canImport="false"
        canDelete
        @delete="removeSelectedFile(file)"
      />
      <template #options>
        <UnnnicButton
          :text="$t('send')"
          type="primary"
          @click="upload"
        />
      </template>
    </UnnnicModal>
  </section>
  <section v-else-if="showUploadModal">
    <div class="modal-upload-container">
      <UnnnicModalUpload
        v-model:files="files"
        v-bind="fileUploadModalProps"
        acceptMultiple
        :maximumUploads="maximumUploads"
        @file-change="files = $event"
        @cancel="closeFileUploadModal"
        @close="closeFileUploadModal"
        @action="upload"
      />
    </div>
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import {
  validateMediaFormat,
  sendMediaMessage,
  getSupportedChatMediaFormats,
} from '@/utils/medias';

export default {
  name: 'FileUploader',

  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    mediasType: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'close', 'progress'],

  data: () => ({
    isMobile: isMobile(),

    showUploadModal: false,
    uploadFileType: '',
    maximumUploads: 5,
  }),

  computed: {
    files: {
      get() {
        return this.validFiles(this.modelValue);
      },
      set(files) {
        this.$emit('update:modelValue', this.validFiles(files));
      },
    },
    fileUploadModalProps() {
      const props = {
        textTitle: this.$t('send_media'),
        supportedFormats: getSupportedChatMediaFormats().join(),
        subtitle: this.$t('upload_area.subtitle', {
          exampleExtensions: '.PNG, .MP4, .PDF',
        }),
        textAction: this.$t('send'),
      };

      return props;
    },
  },

  watch: {
    showUploadModal(newShowUploadModal) {
      if (newShowUploadModal) {
        if (this.isMobile) this.openFileSelector();
        return;
      }

      this.files = [];
    },
  },

  methods: {
    // accessed by external components
    open() {
      this.showUploadModal = true;
    },
    closeFileUploadModal() {
      this.$emit('close');
      this.showUploadModal = false;
    },
    upload() {
      const { modelValue: files } = this;
      sendMediaMessage({
        files,
        routeName: this.$route.name,
        progressCallback: (progress) => this.$emit('progress', progress),
      });

      this.closeFileUploadModal();
      this.files = [];
    },

    validFiles(files) {
      if (files.length > this.maximumUploads) return [];

      return Array.from(files).filter((file) => {
        if (validateMediaFormat([file])) {
          return true;
        }
        return false;
      });
    },

    openFileSelector() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = getSupportedChatMediaFormats(this.mediasType).join();
      input.addEventListener('change', this.handleFileChange);
      input.addEventListener('cancel', this.closeFileUploadModal);
      input.click();
    },

    handleFileChange(event) {
      const selectedFiles = event.target.files;
      const validFiles = this.validFiles(selectedFiles);

      if (validFiles.length === 0) this.closeFileUploadModal();

      this.$emit('update:modelValue', validFiles);
    },

    removeSelectedFile(file) {
      this.files = this.files.filter(
        (mappedFile) => mappedFile.name !== file.name,
      );
      if (this.files.length === 1) {
        this.closeFileUploadModal();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-upload-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  height: 100vh;
  width: 100vw;

  background: rgba(0, 0, 0, $unnnic-opacity-level-clarifying);

  display: flex;
  align-items: center;
  justify-content: center;

  & > * {
    max-width: 32rem;
    flex: 1;
  }
}

.modal-upload-confirm {
  :deep(.unnnic-modal-container-background-body-description) {
    padding: 0;

    .unnnic-import-card__data {
      overflow: hidden;

      &__title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
