<template>
  <p v-if="isGeolocation">{{ media.url }}</p>
  <section v-else-if="isDocument">
    <DocumentPreview
      @download="download"
      :fullFilename="fullFilename"
      highlight
      :url="media.url"
    />
  </section>

  <section
    v-else
    class="media-message"
  >
    <section class="media-message__preview">
      <ImagePreview
        v-if="isImage"
        :url="media.url"
        fullscreenOnClick
        @download="download"
        @click="$emit('fullscreen')"
      />
      <VideoPreview
        v-else-if="isVideo"
        :src="media.url"
      />
      <UnnnicAudioRecorder
        v-else-if="isAudio"
        :src="media.url"
        :canDiscard="false"
      />
    </section>

    <!-- <media-controls v-if="!isAudio" @download="download" /> -->
  </section>
</template>

<script>
import mime from 'mime-types';

import Media from '@/services/api/resources/chats/media';

// import MediaControls from './Controls';
import DocumentPreview from './Previews/Document.vue';
import ImagePreview from './Previews/Image.vue';
import VideoPreview from './Previews/Video.vue';

export default {
  name: 'MediaMessage',

  components: {
    DocumentPreview,
    ImagePreview,
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
      const document = /(pdf|doc(x)?|txt|xls|svn|csv|xlsx)/;
      const contentTypeExtension = mime.extension(this.media.content_type);

      return document.test(contentTypeExtension);
    },
    isImage() {
      const image = /(png|jp(e)?g|webp)/;
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
    isGeolocation() {
      const geolocation = /(geo)/;
      return geolocation.test(this.media.content_type);
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
    max-width: calc(16px * 25);
    max-height: calc(9px * 25);

    display: flex;
  }
}
</style>
