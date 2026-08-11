<template>
  <section
    ref="scrollContainer"
    :class="{
      'tag-group': true,
      flex,
      'tag-group--infinite-scroll': infiniteScroll,
    }"
  >
    <section
      v-if="tags.length > 0"
      ref="container"
      class="tag-group__tags"
    >
      <UnnnicTag
        v-for="tag in tags"
        :key="tag.uuid"
        :ref="tag.uuid"
        :clickable="selectable"
        :text="tag.name"
        :data-testid="`tag__${tag.uuid}`"
        :hasCloseIcon="!!showCloseIcon(tag)"
        :disabled="
          !!(!hasCloseIcon && selectable && isSelectedTag(tag)) || !!disabledTag
        "
        :class="{ 'tag-group__tags__tag--selected': isSelectedTag(tag) }"
        type="brand"
        @click="useCloseClick ? close(tag) : select(tag)"
        @close="close(tag)"
      />
      <p
        v-if="remainingTags > 0"
        ref="remainingTagsRef"
        :title="tagNames.join(', ')"
        class="tag-group__remaining-children"
      >
        +{{ remainingTags }}
      </p>
      <div
        v-if="infiniteScroll"
        ref="infiniteScrollSentinel"
        class="tag-group__sentinel"
        data-testid="tag-group-sentinel"
      />
    </section>
    <UnnnicIconLoading
      v-if="loadingMore"
      class="tag-group__loading"
      data-testid="tag-group-loading"
    />
  </section>
</template>

<script>
export default {
  props: {
    disabledTag: {
      type: Boolean,
      default: false,
    },
    hasCloseIcon: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    flex: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    useCloseClick: {
      type: Boolean,
      default: false,
    },
    tagSize: {
      type: String,
      default: '32px',
    },
    infiniteScroll: {
      type: Boolean,
      default: false,
    },
    canLoadMore: {
      type: Boolean,
      default: false,
    },
    loadingMore: {
      type: Boolean,
      default: false,
    },
    maxHeight: {
      type: String,
      default: '140px',
    },
  },
  emits: ['update:modelValue', 'close', 'add', 'remove', 'load-more'],

  data: () => ({
    remainingTags: 0,
    intersectionObserver: null,
  }),

  computed: {
    selected: {
      get() {
        return this.modelValue;
      },
      set(tags) {
        this.$emit('update:modelValue', tags);
      },
    },
    tagNames() {
      return this.tags.map((tag) => tag.name);
    },
    scrollMaxHeight() {
      return this.maxHeight;
    },
  },

  watch: {
    tags() {
      this.scheduleInfiniteScrollSetup();
    },
    canLoadMore(canLoad) {
      if (canLoad) {
        this.scheduleInfiniteScrollSetup();
      }
    },
    loadingMore(isLoading, wasLoading) {
      if (wasLoading && !isLoading) {
        this.scheduleInfiniteScrollSetup();
      }
    },
  },

  mounted() {
    if (this.infiniteScroll) {
      this.scheduleInfiniteScrollSetup();
    }

    if (this.flex) {
      return;
    }

    this.remainingTags = this.tags.length;

    const observer = new IntersectionObserver(this.handleIntersection);

    this.tags.forEach((child) => {
      const tagElement = this.$refs[child.uuid]?.[0]?.$el;
      if (tagElement) {
        tagElement.setAttribute('data-ref-name', child.uuid);

        observer.observe(tagElement);
      }
    });
  },

  beforeUnmount() {
    this.teardownInfiniteScroll();
  },

  methods: {
    scheduleInfiniteScrollSetup() {
      if (!this.infiniteScroll) return;

      this.$nextTick(() => {
        this.setupInfiniteScroll();
      });
    },
    setupInfiniteScroll() {
      this.teardownInfiniteScroll();

      const sentinel = this.$refs.infiniteScrollSentinel;
      const root = this.$refs.scrollContainer;
      if (!sentinel || !root) return;

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const isVisible = entries.some((entry) => entry.isIntersecting);
          if (isVisible && this.canLoadMore && !this.loadingMore) {
            this.$emit('load-more');
          }
        },
        {
          root,
          rootMargin: '40px',
        },
      );
      this.intersectionObserver.observe(sentinel);
    },
    teardownInfiniteScroll() {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
    },
    select(tag) {
      if (this.disabledTag) {
        this.$emit('close', tag);
        return;
      }

      if (this.isSelectedTag(tag)) {
        this.selected = this.selected.filter((t) => t.uuid !== tag.uuid);
        this.$emit('remove', tag);
        return;
      }

      this.selected = [...this.selected, tag];
      this.$emit('add', tag);
    },
    close(tag) {
      if (this.selectable) {
        this.select(tag);
      }
      this.$emit('close', tag);
    },
    isSelectedTag(tag) {
      return this.selected.find((mappedTag) => mappedTag.uuid === tag.uuid);
    },
    showCloseIcon(tag) {
      return this.hasCloseIcon || (this.selectable && this.isSelectedTag(tag));
    },
    handleIntersection(entries) {
      entries.forEach((entry) => {
        const { remainingTagsRef, container } = this.$refs;
        let remainingTagsPos = '';
        if (entry.isIntersecting) {
          this.remainingTags -= 1;
          remainingTagsPos =
            entry.target.offsetLeft + entry.boundingClientRect.width;
        } else {
          this.remainingTags += 1;
          const refName = entry.target.getAttribute('data-ref-name');
          const tagIndex = this.tags.findIndex((tag) => tag.uuid === refName);
          if (tagIndex > 0) {
            const lastChildUuid = this.tags[tagIndex - 1].uuid;
            const lastElement = this.$refs[lastChildUuid]?.[0].$el;
            if (lastElement) {
              const lastElementBoundingRect =
                lastElement.getBoundingClientRect();
              remainingTagsPos =
                lastElement.offsetLeft + lastElementBoundingRect.width;
            }
          }
        }
        function addPx(string) {
          return `${string}px`;
        }
        if (remainingTagsRef) {
          const remainingTagsPaddingLeft = parseFloat(
            getComputedStyle(remainingTagsRef).paddingLeft,
          );
          container.style.paddingRight = addPx(
            remainingTagsRef.offsetWidth + remainingTagsPaddingLeft,
          );
          remainingTagsRef.style.left = addPx(remainingTagsPos);
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.tag-group {
  display: flex;
  overflow-y: hidden;
  align-items: center;
  margin-top: $unnnic-spacing-xs;
  min-height: v-bind(tagSize);

  &:not(.flex) {
    height: v-bind(tagSize);
  }

  &--infinite-scroll {
    align-items: flex-start;
    max-height: v-bind(scrollMaxHeight);
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__tags {
    position: relative;
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: $unnnic-spacing-sm;
    user-select: none;
    overflow: hidden;
    align-self: flex-start;
    max-width: 100%;

    .tag-group--infinite-scroll & {
      overflow: visible;
    }

    :deep(.chip) {
      width: max-content;
      max-width: 100%;
      height: v-bind(tagSize);
    }
  }

  &__sentinel {
    width: 100%;
    height: 1px;
    flex-basis: 100%;
    min-width: 0;
  }

  &__loading {
    align-self: center;
    margin: $unnnic-spacing-xs auto;
  }

  &__remaining-children {
    position: absolute;
    padding-left: $unnnic-spacing-xs;

    color: $unnnic-color-fg-base;
    font-size: $unnnic-font-size-body-md;

    line-height: 20px;
    margin-right: -16px;

    top: calc(v-bind(tagSize) / 2);
    transform: translateY(-50%);
  }
}
</style>
