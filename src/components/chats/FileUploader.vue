<template>
  <section v-if="showUploadModal">
    <div class="modal-upload-container">
      <unnnic-modal-upload
        v-model="files"
        v-bind="fileUploadModalProps"
        acceptMultiple
        :maximumUploads="5"
        @cancel="closeFileUploadModal"
        @close="closeFileUploadModal"
        @action="upload"
        :maxFileSize="10.48"
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
    // accessed by external components
    open(fileType) {
      this.showUploadModal = true;
      this.uploadFileType = fileType;
    },
    closeFileUploadModal() {
      this.showUploadModal = false;
      this.uploadFileType = '';
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
          textTitle: this.$t('send_photo_or_video'),
          supportedFormats: '.png,.jpeg,.mp4',
          textAction: this.$tc('send_images', this.files.length),
        },
        document: {
          textTitle: this.$tc('send_docs'),
          supportedFormats: '.pdf,.doc,.txt',
          textAction: this.$tc('send_docs', this.files.length),
        },
      };

      return props[this.uploadFileType] || {};
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
</style>
