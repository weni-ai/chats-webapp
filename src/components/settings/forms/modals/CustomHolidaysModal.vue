<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('custom_holidays.title')"
    showCloseIcon
    @update:model-value="$emit('close')"
  >
    <section class="custom-holidays-modal__body">
      <p>{{ $t('custom_holidays.description') }}</p>
      <UnnnicDisclaimer
        iconColor="feedback-yellow"
        :text="$t('custom_holidays.disclaimer')"
      />
      <section class="custom-holidays-modal__day"></section>
    </section>
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'CustomHolidaysModal',
  emits: ['close'],
};
</script>

<style lang="scss" scoped>
.custom-holidays-modal {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }
}
</style>
