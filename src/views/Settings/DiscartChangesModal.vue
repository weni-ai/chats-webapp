<template>
  <UnnnicModalDialog
    :modelValue="showModal"
    size="sm"
    :title="title"
    :primaryButtonProps="{ text: $t('discart') }"
    :secondaryButtonProps="{ text: $t('back') }"
    class="discart-changes-modal"
    data-testid="discart-changes-modal"
  >
    <p class="discart-changes-modal__text">
      {{ text }}
    </p>
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'DiscartChangesModal',
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.discart-changes-modal {
  :deep(.unnnic-modal-dialog__container) {
    // use to centralize modal in connect iframe
    right: calc(55% - 200px);
    margin-top: -64px;
  }
  &__text {
    text-align: left;
    font-size: $unnnic-font-size-body-gt;
    font-family: $unnnic-font-family-secondary;
    line-height: 2 * $unnnic-font-size-body-md;
  }
}
</style>
