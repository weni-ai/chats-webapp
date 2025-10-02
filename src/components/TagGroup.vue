<template>
  <section :class="{ 'tag-group': true, flex }">
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
    </section>
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
  },
  emits: ['update:modelValue', 'close'],

  data: () => ({
    schemes: [
      'aux-purple',
      'aux-orange',
      'aux-pink',
      'brand-weni-dark',
      'weni-600',
      'aux-lemon',
      'aux-blue',
      'neutral-dark',
      'neutral-cloudy',
    ],
    remainingTags: 0,
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
  },

  mounted() {
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

  methods: {
    select(tag) {
      if (this.disabledTag) {
        this.$emit('close', tag);
        return;
      }
      const tags = this.isSelectedTag(tag)
        ? this.selected.filter((t) => t.uuid !== tag.uuid)
        : [...this.selected, tag];

      this.selected = tags;
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
$tag-size: 32px;
.tag-group {
  display: flex;
  overflow-y: hidden;
  align-items: center;
  margin-top: $unnnic-spacing-xs;
  min-height: $tag-size;

  &:not(.flex) {
    height: $tag-size;
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

    :deep(.unnnic-tag) {
      width: min-content;
      max-width: 100%;

      .unnnic-tag__label {
        width: 100%;

        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      &.tag-group__tags__tag--selected {
        outline: $unnnic-border-width-thinner solid $unnnic-color-neutral-clean;
        outline-offset: -$unnnic-border-width-thinner;
      }
    }
  }

  &__remaining-children {
    position: absolute;
    padding-left: $unnnic-spacing-xs;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-md;

    line-height: 20px;
    margin-right: -16px;

    top: calc($tag-size / 2);
    transform: translateY(-50%);
  }
}
</style>
