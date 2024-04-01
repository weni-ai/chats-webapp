<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="media-preview">
    <template v-if="isVideo">
      <UnnnicIcon
        icon="button-play-1"
        size="md"
        class="media-preview__video-play-icon"
      />
      <video
        :src="src"
        :alt="alt"
        class="media-preview__media"
        muted
        ref="video"
        @click="handleClick"
        @keypress.enter="handleClick"
      />
    </template>

    <img
      v-else
      :src="src"
      :alt="alt"
      class="media-preview__media"
      @click="handleClick"
      @keypress.enter="handleClick"
    />
  </div>
</template>

<script>
export default {
  name: 'MediaPreview',

  props: {
    alt: {
      type: String,
      default: '',
    },
    src: {
      type: String,
      default: '',
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    handleClick() {
      this.$emit('click');
    },
  },
};
</script>

<style lang="scss" scoped>
.media-preview {
  position: relative;

  box-shadow: $unnnic-shadow-level-near;

  aspect-ratio: 1/1;
  overflow: hidden;

  cursor: pointer;

  transition: scale ease-in-out 0.1s;

  &:hover {
    scale: 1.05;
  }

  &__media {
    width: 100%;
    height: 100%;

    object-fit: cover;
  }

  &__video-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;

    transform: translate(-50%, -50%);
  }
}
</style>
