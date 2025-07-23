<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('country_holidays.title', { country: 'Brazil' })"
    showCloseIcon
    @update:model-value="$emit('close')"
  >
    <section class="country-holidays-modal__body">
      <p>{{ $t('country_holidays.description') }}</p>
      <UnnnicSwitch
        v-for="holiday in holidays"
        :key="holiday.id"
        :textRight="holiday.name"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'CountryHolidays',
  emits: ['close'],
  data() {
    return {
      holidays: [
        { id: 1, name: 'New Year' },
        { id: 2, name: 'Christmas' },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.country-holidays-modal__body {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;
}
</style>
