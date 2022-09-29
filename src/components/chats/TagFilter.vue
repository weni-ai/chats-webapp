<template>
  <section>
    <p v-if="!!label" class="label">{{ label }}</p>

    <section class="tags">
      <span
        v-for="tag in tags"
        :key="tag.uuid"
        @click="handleSelectedTags(tag.uuid)"
        @keypress.space="handleSelectedTags(tag.uuid)"
      >
        <unnnic-checkbox :textRight="tag.name" size="sm" :value="selected.includes(tag.uuid)" />
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
      default: () => [],
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
