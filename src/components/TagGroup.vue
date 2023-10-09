<template>
  <section :class="{ 'tag-group': true, flex }">
    <div v-if="tags.length > 0" class="tag-group__tags" ref="container">
      <unnnic-tag
        v-for="(tag, i) in tags"
        :key="tag.uuid"
        :clickable="selectable"
        :text="tag.name"
        :data-testid="`tag__${tag.uuid}`"
        :has-close-icon="hasCloseIcon"
        @click="select(tag)"
        @close="close(tag)"
        :disabled="!hasCloseIcon && selectable && !selected.find((t) => t.uuid === tag.uuid)"
        :scheme="schemes[i % schemes.length]"
        :ref="tag.uuid"
      />
      <p
        v-if="remainingTags > 0"
        :title="this.tagNames.join(', ')"
        class="tag-group__remaining-children"
        ref="remainingTagsRef"
      >
        +{{ remainingTags }}
      </p>
    </div>
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
    flex: {
      type: Boolean,
      default: true,
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
      'weni-600',
      'aux-lemon',
      'aux-blue',
      'neutral-dark',
      'neutral-cloudy',
    ],
    remainingTags: 0,
  }),

  mounted() {
    if (this.flex) {
      return;
    }

    console.log(this.tags);
    this.remainingTags = this.tags.length;

    const observer = new IntersectionObserver(this.handleIntersection);
    this.tags.forEach((child) => {
      const tagElement = this.$refs[child.uuid]?.[0].$el;
      tagElement.setAttribute('data-ref-name', child.uuid);

      observer.observe(tagElement);
    });
  },

  computed: {
    selected: {
      get() {
        return this.value;
      },
      set(tags) {
        this.$emit('input', tags);
      },
    },
    tagNames() {
      return this.tags.map((tag) => tag.name);
    },
  },

  methods: {
    select(tag) {
      const tags = this.selected.find((t) => t.uuid === tag.uuid)
        ? this.selected.filter((t) => t.uuid !== tag.uuid)
        : [...this.selected, tag];

      this.selected = tags;
    },
    close(tag) {
      this.$emit('close', tag);
    },
    handleIntersection(entries) {
      entries.forEach((entry) => {
        const { remainingTagsRef, container } = this.$refs;
        let remainingTagsPos = '';

        if (entry.isIntersecting) {
          this.remainingTags -= 1;
          remainingTagsPos = entry.target.offsetLeft + entry.boundingClientRect.width;
        } else {
          this.remainingTags += 1;

          const refName = entry.target.getAttribute('data-ref-name');
          const tagIndex = this.tags.findIndex((tag) => tag.uuid === refName);

          if (tagIndex > 0) {
            const lastChildUuid = this.tags[tagIndex - 1].uuid;
            const lastElement = this.$refs[lastChildUuid]?.[0].$el;

            if (lastElement) {
              const lastElementBoundingRect = lastElement.getBoundingClientRect();
              remainingTagsPos = lastElement.offsetLeft + lastElementBoundingRect.width;
            }
          }
        }

        function addPx(string) {
          return `${string}px`;
        }

        const remainingTagsPaddingLeft = parseFloat(getComputedStyle(remainingTagsRef).paddingLeft);
        container.style.paddingRight = addPx(
          remainingTagsRef.offsetWidth + remainingTagsPaddingLeft,
        );

        remainingTagsRef.style.left = addPx(remainingTagsPos);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
$tag-size: 28px;
.tag-group {
  display: flex;
  height: $tag-size;
  overflow-y: hidden;
  align-items: center;

  &__tags {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: $unnnic-spacing-xs;
    flex: 1;

    align-self: flex-start;
    user-select: none;
    overflow: hidden;
  }

  &__remaining-children {
    position: absolute;
    padding-left: $unnnic-spacing-xs;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-md;

    line-height: 20px;
    margin-right: -16px;

    top: $tag-size / 2;
    transform: translateY(-50%);
  }
}
</style>
