<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('country_holidays.title', { country: 'Brazil' })"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save') }"
    @update:model-value="$emit('close')"
  >
    <section class="country-holidays-modal__body">
      <p>{{ $t('country_holidays.description') }}</p>
      <UnnnicSwitch
        v-for="holiday in holidays"
        :key="holiday.id"
        :textRight="formatHolidayLabel(holiday)"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
import moment from 'moment';

export default {
  name: 'CountryHolidays',
  emits: ['close'],
  data() {
    return {
      holidays: [
        { id: 1, name: 'New Year', start: '2025-01-01', end: '2025-01-01' },
        { id: 2, name: 'Christmas', start: '2025-12-25', end: '2025-12-27' },
      ],
    };
  },
  methods: {
    formatHolidayLabel(holiday) {
      if (!holiday.start) return holiday.name;
      const start = moment(holiday.start).format('L');
      const end = moment(holiday.end).format('L');
      if (start !== end) {
        return `${start} ${this.$t('to')} ${end} - ${holiday.name}`;
      }
      return `${start} - ${holiday.name}`;
    },
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
