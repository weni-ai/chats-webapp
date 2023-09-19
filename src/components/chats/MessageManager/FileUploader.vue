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
import mime from 'mime-types';

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
    supportedFormats: [
      '.png',
      '.jpeg',
      '.jpg',
      '.mp4',
      '.pdf',
      '.doc',
      '.docx',
      '.txt',
      '.xls',
      '.xlsx',
      '.csv',
    ],
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

    validFiles(files) {
      if (files.length > this.maximumUploads) return [];

      return Array.from(files).filter((file) => {
        if (this.validFormat([file])) {
          return true;
        }
        return false;
      });
    },

    validFormat(files) {
      const formats = this.supportedFormats.map((format) => format.trim());

      const isValid = Array.from(files).find((file) => {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const fileExtension = `.${fileName.split('.').pop()}`;

        const isValidFileExtension = formats.includes(fileExtension);
        const isValidFileType = fileType === mime.lookup(fileName);

        return isValidFileExtension && isValidFileType;
      });

      return isValid;
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
        supportedFormats: this.supportedFormats.join(),
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