<template>
  <section
    @click="$emit('download')"
    @keypress.enter="$emit('download')"
    class="document-preview clickable"
    :class="[{ highlight }, size]"
  >
    <unnnic-icon-svg :icon="icon" :scheme="highlight ? 'brand-weni-soft' : 'neutral-darkest'" />
    <span class="filename">
      {{ pathname }}
    </span>

    <unnnic-tool-tip enabled text="Baixar" side="right">
      <unnnic-icon-svg
        icon="download-bottom-1"
        :scheme="highlight ? 'neutral-darkest' : 'brand-weni-soft'"
      />
    </unnnic-tool-tip>
  </section>
</template>

<script>
export default {
  name: 'DocumentPreview',

  props: {
    fullFilename: {
      type: String,
      default: '',
    },
    highlight: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'md',
      validator: (s) => ['sm', 'md'].includes(s),
    },
    src: {
      type: String,
      default: '',
    },
    type: {
      type: String,
    },
  },

  computed: {
    pathname() {
      return new URL(this.fullFilename).pathname.slice(1);
    },

    icon() {
      return 'paginate-filter-text-1';
    },
  },
};
</script>

<style lang="scss" scoped>
.document-preview {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &.highlight {
    .filename {
      color: $unnnic-color-brand-weni-soft;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &.sm {
    .filename {
      font-size: 0.75rem;
    }
  }

  .filename {
    font-size: 0.875rem;
    color: $unnnic-color-neutral-darkest;
  }
}
</style>
