<template>
  <UnnnicModalDialog
    v-if="modelValue"
    :modelValue="modelValue"
    :title="$t('chats.summary.onboarding.title')"
    showCloseIcon
    icon="brand_awareness"
    size="lg"
    persistent
    @update:model-value="$emit('update:modelValue', false)"
  >
    <section class="modal-new-feature__content">
      <p>
        {{ $t('chats.summary.onboarding.description') }}
      </p>
      <section class="modal-new-feature__steps-container">
        {{ $t('chats.summary.onboarding.see_how_it_works') }}
      </section>
      <section class="modal-new-feature__image-container">
        <img
          class="modal-new-feature__image"
          :src="tourGif"
        />
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script>
import tourGif from '@/assets/sumary-onboarding.gif';
export default {
  name: 'ModalNewFeatureInternalNote',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      tourGif,
    };
  },
};
</script>
<style lang="scss" scoped>
.modal-new-feature {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }
  &__steps {
    font: $unnnic-font-body;
    padding-left: $unnnic-spacing-ant;
  }
  &__image {
    border-radius: $unnnic-radius-1;
    box-shadow: 0 $unnnic-space-1 $unnnic-space-1 0 rgba(0, 0, 0, 0.25);
    &-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
  }
}
</style>
