<template>
  <section class="chat-classifier">
    <ChatClassifierLoading v-if="loading" />
    <TagGroup
      v-else
      v-model="selected"
      class="chat-classifier__tag-group"
      :tags="tags"
      scheme="aux-purple"
      selectable
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
        return this.modelValue || [];
      },
      set(selected) {
        this.$emit('update:modelValue', selected);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-classifier {
  width: 100%;

  :deep(.tag-group__tags) {
    justify-content: center;
  }
}
</style>
