<template>
  <section class="media-message-controls">
    <unnnic-icon-svg icon="paginate-filter-text-1" scheme="neutral-cleanest" size="sm" />
    <span class="filename">
      {{ fullFilename }}
    </span>
    <span class="clickable" @click="$emit('download')" @keypress.enter="$emit('download')">
      <unnnic-icon-svg icon="download-bottom-1" scheme="neutral-darkest" size="sm" />
    </span>
  </section>
</template>

<script>
export default {
  name: 'MediaMessageControls',

  props: {
    fileExtension: {
      type: String,
      default: '',
    },
    filename: {
      type: String,
      default: '',
    },
  },

  computed: {
    fullFilename() {
      return this.filename ? `${this.filename}.${this.fileExtension}` : '';
    },
  },
};
</script>

<style lang="scss" scoped>
.media-message-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  .filename {
    font-size: 0.75rem;
    color: $unnnic-color-neutral-cleanest;
    line-height: 1.25rem;
  }
}
</style>
