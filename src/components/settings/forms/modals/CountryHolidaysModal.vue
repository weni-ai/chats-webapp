<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('country_holidays.title', { country: 'Brazil' })"
    showCloseIcon
    @update:model-value="$emit('close')"
  >
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'CountryHolidays',
  emits: ['close'],
};
</script>
