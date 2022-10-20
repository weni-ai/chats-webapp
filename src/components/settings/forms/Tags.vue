<template>
  <section class="form-tags">
    <p class="form-tags__description">{{ $t('tags.description') }}</p>

    <section class="form-tags__section">
      <p class="form-tags__section__label">
        {{ $t('tags.add.title') }}
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
      </p>
      <section class="form-tags__section__input-group">
        <unnnic-input
          v-model="tag"
          @keypress.enter="addTag"
          class="form-tags__section__input-group__input"
          :label="$t('tags.add.label')"
          :placeholder="$t('tags.add.placeholder')"
        />
        <unnnic-button type="secondary" text="Adicionar" @click="addTag" />
      </section>
    </section>

    <section v-if="tags.length > 0" class="form-tags__section">
      <p class="form-tags__section__label">{{ $t('tags.already_added') }}</p>
      <tag-group :tags="tags" selectable has-close-icon @close="removeTag($event)" />
    </section>
  </section>
</template>

<script>
import TagGroup from '@/components/TagGroup';

export default {
  name: 'FormTags',

  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },

  components: {
    TagGroup,
  },

  data: () => ({
    tag: '',
  }),

  computed: {
    tags: {
      get() {
        return this.value;
      },
      set(tags) {
        this.$emit('input', tags);
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
