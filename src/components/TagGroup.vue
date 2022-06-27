<template>
  <section v-if="tags.length > 0" class="tag-group__container">
    <unnnic-tag
      v-for="(tag, i) in tags"
      :key="tag.value"
      :clickable="selectable"
      :text="tag.text"
      :data-testid="`tag__${tag.value}`"
      :has-close-icon="
        hasCloseIcon || (selectable && !!selected.find((t) => t.value === tag.value))
      "
      @click="select(tag)"
      @close="close(tag)"
      :scheme="schemes[i % schemes.length]"
    />
  </section>
</template>

<script>
export default {
  props: {
    hasCloseIcon: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: Array,
      default: () => [],
    },
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    schemes: [
      'aux-purple',
      'aux-orange',
      'aux-pink',
      'brand-weni-dark',
      'brand-weni-soft',
      'aux-lemon',
      'aux-blue',
      'neutral-dark',
      'neutral-cloudy',
    ],
  }),

  computed: {
    selected: {
      get() {
        return this.value;
      },
      set(tags) {
        this.$emit('input', tags);
      },
    },
  },

  methods: {
    select(tag) {
      const tags = this.selected.find((t) => t.value === tag.value)
        ? this.selected.filter((t) => t.value !== tag.value)
        : [...this.selected, tag];

      this.selected = tags;
    },
    close(tag) {
      this.$emit('close', tag);
    },
  },
};
</script>

<style lang="scss" scoped>
.tag-group__container {
  display: flex;
  flex-wrap: wrap;
  gap: $unnnic-spacing-stack-md;
  padding-left: $unnnic-spacing-inset-sm;
  user-select: none;
}
</style>
