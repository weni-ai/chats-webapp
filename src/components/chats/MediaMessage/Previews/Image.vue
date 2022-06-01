<template>
  <div class="image-preview">
    <unnnic-tool-tip class="image-preview__tooltip" enabled :text="tooltip" side="right">
      <img
        :src="src"
        :alt="alt"
        :style="{ 'object-fit': objectFit }"
        class="clickable image-preview__image"
        @click="handleImageClick"
        @keypress.enter="handleImageClick"
      />
    </unnnic-tool-tip>

    <fullscreen-preview
      v-if="isFullscreen"
      @download="$emit('download')"
      @close="isFullscreenByUserClick = false"
      @next="nextMedia"
      @previous="previousMedia"
    >
      <img :src="src" :alt="alt" @keypress.enter="() => {}" @click.stop="() => {}" />
    </fullscreen-preview>
  </div>
</template>

<script>
import FullscreenPreview from './Fullscreen';

export default {
  name: 'MediaImagePreview',

  components: {
    FullscreenPreview,
  },

  props: {
    alt: {
      type: String,
      default: '',
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    fullscreenOnClick: {
      type: Boolean,
      default: false,
    },
    objectFit: {
      type: String,
      default: 'contain',
      validator: (v) => ['fill', 'contain', 'cover', 'scale-down', 'none'].includes(v),
    },
    src: {
      type: String,
      default: '',
    },
    tooltip: {
      type: String,
      default: 'Visualizar em tela cheia',
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
    handleImageClick() {
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
.image-preview {
  height: inherit;
  width: inherit;
  max-height: inherit;
  max-width: inherit;

  &__tooltip,
  &__image {
    height: inherit;
    width: inherit;
    max-width: inherit;
    max-height: inherit;
  }
}
</style>
