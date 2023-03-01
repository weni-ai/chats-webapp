<template>
  <section class="chat-classifier__container">
    <section class="content">
      <p v-if="!!label" class="label">{{ label }}</p>
      <section class="tags">
        <tag-group v-model="selected" :tags="tags" selectable />
      </section>
    </section>

    <section class="actions">
      <slot name="actions" />
    </section>
  </section>
</template>

<script>
import TagGroup from '@/components/TagGroup';

export default {
  name: 'ChatClassifier',

  components: {
    TagGroup,
  },

  props: {
    label: {
      type: String,
      default: '',
    },
    value: {
      type: Array,
      default: () => [],
    },
    tags: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    handleSelectedTags(tag) {
      const tags = this.selected.some((t) => t.uuid === tag.uuid)
        ? this.selected.filter((t) => t.uuid !== tag.uuid)
        : [...this.selected, { ...tag }];

      this.selected = tags;
    },
  },

  computed: {
    selected: {
      get() {
        return this.value || [];
      },
      set(selected) {
        this.$emit('input', selected);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-classifier__container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  // border-top: solid 1px $unnnic-color-neutral-clean;
  padding: $unnnic-spacing-inset-md;

  .content {
    .label {
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-darkest;
      margin-bottom: $unnnic-spacing-inline-sm;
    }

    .tags {
      display: flex;
      gap: 1.5rem;

      .selected {
        border: solid 1px $unnnic-color-neutral-dark;
      }
    }
  }
}
</style>
