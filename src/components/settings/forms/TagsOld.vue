<template>
  <section class="form-tags">
    <!-- <p class="form-tags__description">{{ $t('tags.description') }}</p> -->

    <section class="form-tags__section">
      <p class="form-tags__section__label">
        {{ $t('tags.add.title') }}
        <UnnnicToolTip
          enabled
          side="right"
          :text="$t('new_sector.tags_tip')"
          maxWidth="23rem"
        >
          <UnnnicIconSvg
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </p>
      <section class="form-tags__section__input-group">
        <UnnnicInput
          v-model="tag"
          class="form-tags__section__input-group__input"
          :label="$t('tags.add.label')"
          :placeholder="$t('tags.add.placeholder')"
          @keypress.enter="addTag"
        />
        <UnnnicButton
          type="secondary"
          :text="$t('add')"
          @click="addTag"
        />
      </section>
    </section>

    <section
      v-if="tags.length > 0"
      class="form-tags__section"
    >
      <p class="form-tags__section__label">{{ $t('tags.already_added') }}</p>
      <TagGroup
        :tags="tags"
        selectable
        hasCloseIcon
        @close="removeTag($event)"
      />
    </section>
  </section>
</template>

<script>
import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'FormTags',

  components: {
    TagGroup,
  },

  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'add', 'remove'],

  data: () => ({
    tag: '',
  }),

  computed: {
    tags: {
      get() {
        return this.modelValue;
      },
      set(tags) {
        this.$emit('update:modelValue', tags);
      },
    },
  },

  methods: {
    addTag() {
      const name = this.tag.trim();
      if (!name) return;

      this.$emit('add', name);
      this.tag = '';
    },
    removeTag(tag) {
      this.$emit('remove', tag.uuid);
    },
  },
};
</script>

<style lang="scss" scoped>
.form-tags {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-md;

  &__description {
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-cloudy;
  }

  &__section {
    &__label {
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      margin-bottom: $unnnic-spacing-inline-sm;
    }

    &__input-group {
      display: flex;
      align-items: flex-end;
      gap: $unnnic-spacing-stack-sm;

      &__input {
        flex: 1 1;
      }
    }
  }
}
</style>
