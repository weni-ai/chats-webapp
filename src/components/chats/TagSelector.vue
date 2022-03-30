<template>
  <section>
    <p v-if="!!label" class="label">{{ label }}</p>

    <section class="tags">
      <unnnic-tag
        v-for="tag in orderedTags"
        :key="tag.text"
        clickable
        :text="tag.text"
        :hasCloseIcon="selected.includes(tag.value)"
        :class="{ selected: selected.includes(tag.value) }"
        @click="handleSelectedTags(tag.value)"
      />
    </section>
  </section>
</template>

<script>
export default {
  name: 'TagSelector',

  props: {
    label: {
      type: String,
      default: '',
    },
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    tags: [
      { text: 'Dúvidas', value: 'doubts' },
      { text: 'Financeiro', value: 'finance' },
      { text: 'Ajuda', value: 'help' },
    ],
  }),

  methods: {
    handleSelectedTags(tag) {
      const tags = this.selected.includes(tag)
        ? this.selected.filter((t) => t !== tag)
        : [...this.selected, tag];

      this.selected = tags;
    },
  },

  computed: {
    orderedTags() {
      const tags = [...this.tags];

      const orderedTags = tags.sort((a, b) => {
        if (this.selected.includes(a.value) > this.selected.includes(b.value)) return -1;
        return 1;
      });

      return orderedTags;
    },
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
  color: $unnnic-color-neutral-darkest;
  margin-bottom: 0.5rem;
}

.tags {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 1rem 1rem 1.5rem;

  border: solid 1px $unnnic-color-neutral-soft;
  border-radius: 0.25rem;

  .selected {
    border: solid 1px $unnnic-color-neutral-dark;
  }
}
</style>
