<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('country_holidays.title', { country: 'Brazil' })"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save') }"
    @primary-button-click="handleSave"
    @update:model-value="$emit('close')"
  >
    <section class="country-holidays-modal__body">
      <p>{{ $t('country_holidays.description') }}</p>
      <UnnnicSwitch
        v-for="holiday in holidays"
        :key="holiday.date"
        :modelValue="enableHolidays.includes(holiday.date)"
        :textRight="formatHolidayLabel(holiday)"
        @update:model-value="handleClickSelectHoliday(holiday)"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
import moment from 'moment';

export default {
  name: 'CountryHolidays',
  props: {
    holidays: {
      type: Array,
      required: true,
    },
    enableHolidays: {
      type: Array,
      required: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'update:enable-holidays', 'update:disabled-holidays'],
  data() {
    return {
      internalEnableHolidays: this.enableHolidays,
    };
  },
  computed: {
    key() {
      return this.isEditing ? 'uuid' : 'date';
    },
  },
  mounted() {
    console.log(this.holidays);
  },
  methods: {
    formatHolidayLabel(holiday) {
      if (!holiday.date) return holiday.name;
      const date = moment(holiday.date).format('L');

      return `${date} - ${holiday.name}`;
    },
    handleClickSelectHoliday(holiday) {
      const hasDate = this.internalEnableHolidays.includes(holiday.date);
      if (hasDate) {
        this.internalEnableHolidays = this.internalEnableHolidays.filter(
          (date) => date !== holiday.date,
        );
      } else {
        this.internalEnableHolidays = [
          ...this.internalEnableHolidays,
          holiday.date,
        ];
      }
    },
    handleSave() {
      this.$emit('update:enable-holidays', this.internalEnableHolidays);
      this.$emit(
        'update:disabled-holidays',
        this.holidays.filter(
          (holiday) => !this.internalEnableHolidays.includes(holiday.date),
        ),
      );
      this.$emit('close');
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
