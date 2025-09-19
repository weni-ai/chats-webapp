<template>
  <UnnnicModalDialog
    v-if="modelValue"
    :modelValue="modelValue"
    :title="$t('new_feature_internal_note.title')"
    showCloseIcon
    icon="brand_awareness"
    size="lg"
    persistent
    @update:model-value="$emit('update:modelValue', false)"
  >
    <section class="modal-new-feature-internal-note__content">
      <p>
        {{ $t('new_feature_internal_note.description') }}
      </p>
      <section class="modal-new-feature-internal-note__steps-container">
        <p class="modal-new-feature-internal-note__steps__title">
          {{ $t('new_feature_internal_note.steps.title') }}
        </p>
        <ul class="modal-new-feature-internal-note__steps">
          <li
            v-for="i in 5"
            :key="i"
            class="modal-new-feature-internal-note__steps__item"
            v-html="$t(`new_feature_internal_note.steps.step_${i}`)"
          />
        </ul>
      </section>
      <section class="modal-new-feature-internal-note__image-container">
        TODO: Add gif
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'ModalNewFeatureInternalNote',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
};
</script>
<style lang="scss">
.modal-new-feature-internal-note {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }
  &__steps {
    &__title {
      font: $unnnic-font-body;
      font-weight: $unnnic-font-weight-black;
    }
    list-style-position: inside;
    list-style-type: disc;

    font: $unnnic-font-body;
    padding-left: $unnnic-spacing-ant;
  }
  &__image {
    &__container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
  }
}
</style>
