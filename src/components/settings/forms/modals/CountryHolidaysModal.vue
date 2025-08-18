<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('country_holidays.title', { country: 'Brazil' })"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save'), loading: isLoadingRequest }"
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
import Sector from '@/services/api/resources/settings/sector';

import moment from 'moment';
import unnnic from '@weni/unnnic-system';

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
    sectorUuid: {
      type: String,
      default: '',
    },
  },
  emits: ['close', 'update:enable-holidays', 'update:disabled-holidays'],
  data() {
    return {
      internalEnableHolidays: this.enableHolidays,
      isLoadingRequest: false,
    };
  },
  computed: {
    holidayKey() {
      return this.isEditing ? 'uuid' : 'date';
    },
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
    async handleSave() {
      const { enabled_holidays, disabled_holidays } = this.holidays.reduce(
        (accumulator, holiday) => {
          if (this.internalEnableHolidays.includes(holiday.date)) {
            accumulator.enabled_holidays.push(holiday[this.holidayKey]);
          } else {
            accumulator.disabled_holidays.push(holiday[this.holidayKey]);
          }
          return accumulator;
        },
        { enabled_holidays: [], disabled_holidays: [] },
      );

      if (this.isEditing) {
        try {
          this.isLoadingRequest = true;
          await Sector.updateCountryHoliday(this.sectorUuid, {
            enabled_holidays,
            disabled_holidays,
          });
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('country_holidays.message.success'),
              type: 'success',
            },
          });
        } catch (error) {
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('country_holidays.message.error'),
              type: 'error',
            },
          });
          console.log(error);
          return;
        } finally {
          this.isLoadingRequest = false;
        }
      }
      this.$emit('update:enable-holidays', enabled_holidays);
      this.$emit('update:disabled-holidays', disabled_holidays);
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
