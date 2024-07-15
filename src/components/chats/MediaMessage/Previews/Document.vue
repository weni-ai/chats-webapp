<template>
  <section
    class="document-preview clickable"
    :class="[{ highlight }, size]"
    @click="
      $emit('download');
      openFile(url);
    "
    @keypress.enter="$emit('download')"
  >
    <UnnnicIconSvg
      :icon="icon"
      :scheme="highlight ? 'weni-600' : 'neutral-darkest'"
    />
    <span
      class="filename"
      style="white-space: nowrap"
    >
      {{ pathname }}
    </span>

    <UnnnicToolTip
      enabled
      text="Baixar"
      side="right"
    >
      <UnnnicIconSvg
        icon="download-bottom-1"
        :scheme="highlight ? 'neutral-darkest' : 'weni-600'"
      />
    </UnnnicToolTip>
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
    media: {
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
    url: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: '',
    },
  },
  emits: ['download'],

  computed: {
    pathname() {
      return this.fullFilename;
    },

    icon() {
      return 'paginate-filter-text-1';
    },
  },

  methods: {
    async openFile(media) {
      try {
        window.open(media);
      } catch (err) {
        console.error('Não foi possível realizar o download no momento');
      }
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
      color: $unnnic-color-weni-600;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &.sm {
    .filename {
      font-size: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .filename {
    font-size: 0.875rem;
    color: $unnnic-color-neutral-darkest;
  }
}
</style>
