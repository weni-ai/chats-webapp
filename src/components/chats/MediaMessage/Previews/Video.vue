<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="video-preview">
    <fullscreen-preview
      v-if="isFullscreen"
      @download="$emit('download')"
      @close="isFullscreenByUserClick = false"
      @next="nextMedia"
      @previous="previousMedia"
    >
      <video controls @keypress.enter="() => {}" @click.stop="() => {}">
        <source :src="src" />
      </video>
    </fullscreen-preview>

    <video
      class="video-preview__video"
      v-else
      controls
      @click="handleVideoClick"
      @keypress.enter="handleVideoClick"
    >
      <source :src="src" />
    </video>
  </div>
</template>

<script>
import FullscreenPreview from './Fullscreen';

export default {
  name: 'MediaVideoPreview',

  components: {
    FullscreenPreview,
  },

  props: {
    fullscreen: {
      type: Boolean,
      default: false,
    },
    fullscreenOnClick: {
      type: Boolean,
      default: false,
    },
    src: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    isFullscreenByUserClick: false,
  }),

  computed: {
    isFullscreen() {
      return this.fullscreen || this.isFullscreenByUserClick;
    },
  },

  methods: {
    handleVideoClick() {
      if (this.fullscreenOnClick) {
        this.isFullscreenByUserClick = true;
      }

      this.$emit('click');
    },
    nextMedia() {
      console.log('next media');
    },
    previousMedia() {
      console.log('previous media');
    },
  },
};
</script>

<style lang="scss" scoped>
.video-preview {
  max-height: inherit;
  max-width: inherit;

  &__video {
    max-height: inherit;
    max-width: inherit;
  }
}
</style>
