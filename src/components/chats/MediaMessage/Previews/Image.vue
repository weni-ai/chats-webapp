<template>
  <div class="image-preview">
    <UnnnicToolTip
      class="image-preview__tooltip"
      enabled
      :text="tooltip || $t('fullscreen_view')"
      side="right"
    >
      <img
        :src="url"
        :alt="alt"
        :style="{ 'object-fit': objectFit }"
        class="clickable image-preview__image"
        @click="handleImageClick"
        @keypress.enter="handleImageClick"
      />
    </UnnnicToolTip>
  </div>
</template>

<script>
export default {
  name: 'MediaImagePreview',

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
      validator: (v) =>
        ['fill', 'contain', 'cover', 'scale-down', 'none'].includes(v),
    },
    url: {
      type: String,
      default: '',
    },
    tooltip: {
      type: String,
      default: '',
    },
  },
  emits: ['click'],

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
