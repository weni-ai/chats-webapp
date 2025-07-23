<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="'Specific Non-working Dates'"
    showCloseIcon
    @update:model-value="$emit('close')"
  >
    <section class="custom-holidays-modal__body">
      <p>
        If necessary, you can delete each of the dates or periods and they will
        be considered as a business day.
      </p>
      <UnnnicDisclaimer
        iconColor="feedback-yellow"
        :text="'Deleting dates or periods cannot be undone. Click the Save Changes button to confirm the action.'"
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
    gap: 16px;
  }
}
</style>
