<template>
  <section class="media-message">
    <image-preview :src="media.src" :alt="media.alt" :height="media.height" :width="media.width" />
    <media-controls
      :filename="media.filename"
      :fileExtension="media.fileExtension"
      @download="download"
    />
  </section>
</template>

<script>
import MediaControls from './Controls';
import ImagePreview from './Previews/Image';

export default {
  name: 'MediaMessage',

  components: {
    ImagePreview,
    MediaControls,
  },

  props: {
    media: {
      type: Object,
      required: true,
    },
  },

  methods: {
    download() {
      console.log('download');
    },
  },
};
</script>
<style lang="scss" scoped>
.media-message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
