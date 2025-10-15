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
      selectable
      data-testid="tag-group"
      @remove="handleRemoveTag"
      @add="handleAddTag"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

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

  emits: ['update:modelValue', 'update:toRemoveTags', 'update:toAddTags'],

  data() {
    return {
      toRemoveTags: [],
      toAddTags: [],
    };
  },

  computed: {
    ...mapState(useRooms, ['activeRoomTags']),
    selected: {
      get() {
        return this.modelValue || [];
      },
      set(selected) {
        this.$emit('update:modelValue', selected);
      },
    },
  },

  watch: {
    toRemoveTags: {
      handler(newVal) {
        this.$emit('update:toRemoveTags', newVal);
      },
      deep: true,
    },
    toAddTags: {
      handler(newVal) {
        this.$emit('update:toAddTags', newVal);
      },
      deep: true,
    },
  },

  methods: {
    handleRemoveTag(tag) {
      const hasTag = this.activeRoomTags.some(
        (mappedTag) => mappedTag.uuid === tag.uuid,
      );

      if (hasTag) {
        this.toRemoveTags.push(tag.uuid);
      }

      this.toAddTags = this.toAddTags.filter(
        (mappedTag) => mappedTag !== tag.uuid,
      );
    },
    handleAddTag(tag) {
      const hasTag = this.activeRoomTags.some(
        (mappedTag) => mappedTag.uuid === tag.uuid,
      );

      if (!hasTag) {
        this.toAddTags.push(tag.uuid);
      }

      this.toRemoveTags = this.toRemoveTags.filter(
        (mappedTag) => mappedTag !== tag.uuid,
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-classifier {
  width: 100%;
}
</style>
