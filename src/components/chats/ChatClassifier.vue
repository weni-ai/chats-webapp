<template>
  <section class="chat-classifier">
    <ChatClassifierLoading
      v-if="loading"
      data-testid="chat-classifier-loading"
    />
    <TagGroup
      v-else
      v-model="selected"
      class="chat-classifier__tag-group"
      :tags="tags"
      scheme="aux-purple"
      selectable
      data-testid="tag-group"
    />
  </section>
</template>

<script>
import ChatClassifierLoading from '@/views/loadings/chat/ChatClassifier.vue';

import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'ChatClassifier',

  components: {
    ChatClassifierLoading,
    TagGroup,
  },

  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    tags: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue'],

  computed: {
    selected: {
      get() {
        return this.modelValue || [];
      },
      set(selected) {
        this.$emit('update:modelValue', selected);
      },
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
};
</script>

<style lang="scss" scoped>
.chat-classifier {
  width: 100%;
}
</style>
