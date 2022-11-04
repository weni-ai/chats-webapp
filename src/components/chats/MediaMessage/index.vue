<template>
  <section v-if="isDocument">
    <document-preview :fullFilename="fullFilename" @download="download" highlight />
  </section>

  <section v-else class="media-message">
    <section class="media-message__preview">
      <image-preview
        v-if="isImage"
        :url="media.url"
        :alt="fullFilename"
        fullscreen-on-click
        @download="download"
      />
      <video-preview v-else-if="isVideo" :src="media.url" fullscreen-on-click />
      <unnnic-audio-recorder v-else-if="isAudio" :src="media.url" />
    </section>

    <media-controls v-if="!isAudio" :fullFilename="fullFilename" @download="download" />
  </section>
</template>

<script>
import Media from '@/services/api/resources/chats/media';

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

  computed: {
    fullFilename() {
      const filename = this.media.url.split('/').at(-1);
      return filename;
    },
    isDocument() {
      const document = /(pdf|doc(x)?|txt)/;
      return document.test(this.media.content_type);
    },
    isImage() {
      const image = /(png|jp(e)?g)/;
      return image.test(this.media.content_type);
    },
    isVideo() {
      const video = /(mp4)/;
      return video.test(this.media.content_type);
    },
    isAudio() {
      const audio = /(mpeg3|wav|ogg)/;
      return audio.test(this.media.content_type);
    },
  },

  methods: {
    async download() {
      try {
        const { url } = this.media;
        const file = await Media.get(url);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = this.fullFilename;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error('Não foi possível realizar o download no momento');
      }
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
