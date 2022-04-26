<template>
  <fullscreen-preview
    v-if="isFullscreen"
    @download="$emit('download')"
    @close="isFullscreenByUserClick = false"
    @next="nextMedia"
    @previous="previousMedia"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
    <video controls @keypress.enter="() => {}" @click.stop="() => {}">
      <source :src="src" />
    </video>
  </fullscreen-preview>

  <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
  <video
    v-else
    controls
    :width="width"
    @click="handleVideoClick"
    @keypress.enter="handleVideoClick"
    :height="shouldInferHeight ? getHeightProportionalToWidthInPixels() : height"
  >
    <source :src="src" />
  </video>
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
    height: {
      type: [String, Number],
      default: 'auto', // calculate by width with proportion of 16:9
      validator: (h) => h === 'auto' || !Number.isNaN(Number(h)),
    },
    src: {
      type: String,
      default: '',
    },
    width: {
      type: [String, Number],
      default: 16 * 14, // 224px (16:9 proportion)
      validator: (w) => !Number.isNaN(Number(w)),
    },
  },

  data: () => ({
    isFullscreenByUserClick: false,
  }),

  computed: {
    isFullscreen() {
      return this.fullscreen || this.isFullscreenByUserClick;
    },
    shouldInferHeight() {
      return !this.height || (this.height === 'auto' && this.width);
    },
  },

  methods: {
    getHeightProportionalToWidthInPixels() {
      if (!this.width) return 0;

      return (this.width * 9) / 16; // 16:9 proportion
    },
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
