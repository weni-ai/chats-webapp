<template>
  <section>
    <p
      v-if="!!label"
      class="label"
      data-testid="tag-filter-label"
    >
      {{ label }}
    </p>

    <section class="tags">
      <span
        v-for="tag in tags"
        :key="tag.uuid"
        @click="handleSelectedTags(tag.uuid)"
        @keypress.space="handleSelectedTags(tag.uuid)"
      >
        <UnnnicCheckbox
          :textRight="tag.name"
          size="sm"
          :value="selected.includes(tag.uuid)"
          data-testid="tag-checkbox"
        />
      </span>
    </section>
  </section>
</template>

<script>
export default {
  name: 'TagFilter',

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
      required: true,
    },
  },
  emits: ['input'],

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

  methods: {
    handleSelectedTags(tag) {
      const tags = this.selected.includes(tag)
        ? this.selected.filter((t) => t !== tag)
        : [...this.selected, tag];

      this.selected = tags;
    },
  },
};
</script>

<style lang="scss" scoped>
.label {
  font-size: 0.875rem;
  color: $unnnic-color-neutral-cloudy;
  margin-bottom: 1.5rem;
}

.tags {
  display: flex;
  gap: 1.5rem;
}
</style>
