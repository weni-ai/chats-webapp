<template>
  <section
    class="document-preview clickable"
    @click="$emit('download')"
    @keypress.enter="$emit('download')"
  >
    <unnnic-icon-svg icon="paginate-filter-text-1" scheme="brand-weni-soft" />
    <span class="filename">
      {{ fullFilename }}
    </span>
    <unnnic-icon-svg icon="download-bottom-1" scheme="neutral-darkest" />
  </section>
</template>

<script>
export default {
  name: 'DocumentPreview',

  props: {
    src: {
      type: String,
      default: '',
    },
    fullFilename: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.document-preview {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  .filename {
    font-size: 0.875rem;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-brand-weni-soft;
  }
}
</style>
