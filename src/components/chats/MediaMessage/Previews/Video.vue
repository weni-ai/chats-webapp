<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="video-preview">
    <video
      class="video-preview__video"
      controls
      @click="handleVideoClick"
      @keypress.enter="handleVideoClick"
    >
      <source :src="src" />
    </video>
  </div>
</template>

<script>
export default {
  name: 'MediaVideoPreview',

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
