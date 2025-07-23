<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('custom_holidays.title')"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save') }"
    @update:model-value="$emit('close')"
  >
    <section class="custom-holidays-modal__body">
      <p>{{ $t('custom_holidays.description') }}</p>
      <UnnnicDisclaimer
        iconColor="feedback-yellow"
        :text="$t('custom_holidays.disclaimer')"
      />
      <section
        v-for="date in holidays"
        :key="date.id"
        class="custom-holidays-modal__holiday"
      >
        <p class="custom-holidays-modal__holidays-container__title">
          {{ getDateFormattedLabel(date) }}
        </p>
        <UnnnicIcon
          icon="delete"
          clickable
          scheme="feedback-red"
          size="ant"
        />
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script>
import moment from 'moment';

export default {
  name: 'CustomHolidaysModal',
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
    getDateFormattedLabel(date) {
      if (!date.start) return date.name;
      const start = moment(date.start).format('L');
      const end = moment(date.end).format('L');
      if (start !== end) {
        return `${start} ${this.$t('to')} ${end} - ${date.name}`;
      }
      return `${start} - ${date.name}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.custom-holidays-modal {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }

  &__holiday {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $unnnic-spacing-sm;
  }
}
</style>
