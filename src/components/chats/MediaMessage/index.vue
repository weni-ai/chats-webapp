<template>
  <section v-if="isDocument">
    <document-preview :fullFilename="fullFilename" @download="download" highlight />
  </section>

  <section v-else class="media-message">
    <section class="media-message__preview">
      <image-preview
        v-if="media.type === 'image'"
        :src="media.src"
        :alt="media.alt"
        fullscreen-on-click
        @download="download"
      />
      <video-preview v-else-if="media.type === 'video'" :src="media.src" fullscreen-on-click />
    </section>

    <media-controls :fullFilename="fullFilename" @download="download" />
  </section>
</template>

<script>
import MediaControls from './Controls';
import DocumentPreview from './Previews/Document';
import ImagePreview from './Previews/Image';
import VideoPreview from './Previews/Video';

export default {
  name: 'MediaMessage',

  components: {
    DocumentPreview,
    ImagePreview,
    MediaControls,
    VideoPreview,
  },

  props: {
    media: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    mediaTypes: ['image', 'document', 'video'],
  }),

  computed: {
    fullFilename() {
      return this.media.filename ? `${this.media.filename}.${this.media.fileExtension}` : '';
    },
    isDocument() {
      return this.media.type === 'document';
    },
  },

  methods: {
    async download() {
      const { src, fileExtension, type } = this.media;
      const response = await fetch(src).catch(() =>
        console.error('Não foi possível realizar o download no momento'),
      );

      if (!response) return;

      const responseBlob = await response.blob();

      const blob = new Blob([responseBlob], { type: `${type}/${fileExtension}` });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.fullFilename;
      link.click();
      URL.revokeObjectURL(link.href);
    },
  },
};
</script>
<style lang="scss" scoped>
.media-message {
  display: inline-flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;

  &__preview {
    max-width: calc(16px * 15);
    max-height: calc(9px * 17);
  }
}
</style>
