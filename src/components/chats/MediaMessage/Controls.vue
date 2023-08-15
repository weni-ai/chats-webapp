<template>
  <section class="media-message-controls">
    <unnnic-icon-svg icon="paginate-filter-text-1" scheme="neutral-clean" size="sm" />
    <span class="filename">
      {{ fullFilename }}
    </span>

    <unnnic-tool-tip enabled :text="$t('download')" side="right">
      <span class="clickable" @click="$emit('download')" @keypress.enter="$emit('download')">
        <unnnic-icon-svg icon="download-bottom-1" scheme="neutral-darkest" size="sm" />
      </span>
    </unnnic-tool-tip>
  </section>
</template>

<script>
export default {
  name: 'MediaMessageControls',

  props: {
    fullFilename: {
      type: String,
      default: '',
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
    color: $unnnic-color-neutral-clean;
    line-height: 1.25rem;
  }
}
</style>
