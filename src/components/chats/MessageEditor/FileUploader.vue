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
    open() {
      this.showUploadModal = true;
    },
    closeFileUploadModal() {
      this.showUploadModal = false;
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
      const props = {
        textTitle: this.$t('send_media'),
        supportedFormats: '.png,.jpeg,.jpg,.mp4,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.xlsx',
        subtitle: this.$t('upload_area.subtitle', { exampleExtensions: '.PNG, .MP4, .PDF' }),
        textAction: this.$t('send'),
      };

      return props;
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
