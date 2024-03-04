<template>
  <section v-if="showUploadModal">
    <div class="modal-upload-container">
      <unnnic-modal-upload
        v-model="files"
        v-bind="fileUploadModalProps"
        acceptMultiple
        :maximumUploads="maximumUploads"
        @cancel="closeFileUploadModal"
        @close="closeFileUploadModal"
        @action="upload"
      />
    </div>
  </section>
</template>

<script>
import {
  validateMediaFormat,
  sendMediaMessage,
  getSupportedChatMediaFormats,
} from '@/utils/medias';

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
    maximumUploads: 5,
  }),

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
      const { value: files } = this;

      sendMediaMessage({
        files,
        routeName: this.$route.name,
        storeDispatch: this.$store.dispatch,
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
  },

  computed: {
    files: {
      get() {
        return this.validFiles(this.value);
      },
      set(files) {
        this.$emit('input', this.validFiles(files));
      },
    },
    fileUploadModalProps() {
      const props = {
        textTitle: this.$t('send_media'),
        supportedFormats: getSupportedChatMediaFormats().join(),
        subtitle: this.$t('upload_area.subtitle', { exampleExtensions: '.PNG, .MP4, .PDF' }),
        textAction: this.$t('send'),
      };

      return props;
    },
  },

  watch: {
    showUploadModal(newShowUploadModal) {
      if (!newShowUploadModal) {
        this.files = [];
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
</style>
