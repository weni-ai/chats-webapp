<template>
  <section>
    <unnnic-dropdown position="top-left">
      <template #trigger>
        <slot name="trigger">
          <unnnic-button-icon slot="trigger" icon="upload-bottom-1" size="small" />
        </slot>
      </template>
      <unnnic-dropdown-item>
        <span
          class="upload-dropdown-option"
          @click="openFileUploadModal('media')"
          @keypress.enter="openFileUploadModal('media')"
        >
          <unnnic-icon-svg icon="video-file-mp4-1" />
          <span> Enviar mídia </span>
        </span>
      </unnnic-dropdown-item>
      <unnnic-dropdown-item>
        <span
          class="upload-dropdown-option"
          @click="openFileUploadModal('document')"
          @keypress.enter="openFileUploadModal('document')"
        >
          <unnnic-icon-svg icon="upload-bottom-1" />
          <span> Enviar documento </span>
        </span>
      </unnnic-dropdown-item>
    </unnnic-dropdown>

    <div v-if="showUploadModal" class="modal-upload-container">
      <unnnic-modal-upload
        v-model="files"
        v-bind="fileUploadModalProps"
        acceptMultiple
        :maximumUploads="5"
        @cancel="closeFileUploadModal"
        @close="closeFileUploadModal"
        @action="upload"
      />
    </div>
  </section>
</template>

<script>
export default {
  name: 'FileUploader',

  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    showUploadModal: false,
    uploadFileType: '',
  }),

  methods: {
    closeFileUploadModal() {
      this.showUploadModal = false;
      this.uploadFileType = '';
    },
    openFileUploadModal(fileType) {
      this.showUploadModal = true;
      this.uploadFileType = fileType;
    },
    upload() {
      this.$emit('upload');

      this.showUploadModal = false;
      this.files = [];
    },
  },

  computed: {
    files: {
      get() {
        return this.value;
      },
      set(files) {
        this.$emit('input', files);
      },
    },
    fileUploadModalProps() {
      if (!this.uploadFileType) return {};

      const props = {
        media: {
          textTitle: 'Enviar foto ou vídeo',
          supportedFormats: '.png,.jpeg,.mp4',
          textAction: this.files.length > 1 ? 'Enviar imagens' : 'Enviar imagem',
        },
        document: {
          textTitle: 'Enviar documento',
          supportedFormats: '.pdf,.doc,.txt',
          textAction: this.files.length > 1 ? 'Enviar documentos' : 'Enviar documento',
        },
      };

      return props[this.uploadFileType] || {};
    },
  },
};
</script>

<style lang="scss" scoped>
.upload-dropdown-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

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
</style>
