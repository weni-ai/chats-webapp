<template>
  <div class="media-preview">
    <img
      :src="image"
      :alt="alt"
      class="media-preview__image"
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
    image: {
      type: String,
      default: '',
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
$preview-size: 68px;
.image-preview {
  height: $preview-size;
  width: $preview-size;
  max-height: $preview-size;
  max-width: $preview-size;

  &__image {
    width: 100%;
    height: 100%;
  }
}
</style>
