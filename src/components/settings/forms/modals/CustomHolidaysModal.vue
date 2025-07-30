<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('custom_holidays.title')"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save') }"
    @primary-button-click="save"
    @update:model-value="$emit('close')"
  >
    <section class="custom-holidays-modal__body">
      <p>{{ $t('custom_holidays.description') }}</p>
      <UnnnicDisclaimer
        iconColor="feedback-yellow"
        :text="$t('custom_holidays.disclaimer')"
      />
      <section
        v-for="holiday in holidays"
        :key="holiday.uuid"
        class="custom-holidays-modal__holiday"
      >
        <p
          :class="{
            'custom-holidays-modal__holiday__title': true,
            'custom-holidays-modal__holiday__title--deleted':
              toDeleteIds.includes(holiday.uuid),
          }"
        >
          {{ getDateFormattedLabel(holiday) }}
        </p>
        <UnnnicToolTip
          v-if="!toDeleteIds.includes(holiday.uuid)"
          enabled
          side="left"
          :text="$t('delete')"
        >
          <UnnnicIcon
            icon="delete"
            clickable
            scheme="feedback-red"
            size="ant"
            @click="toDeleteIds.push(holiday.uuid)"
          />
        </UnnnicToolTip>
        <UnnnicToolTip
          v-else
          enabled
          side="left"
          :text="$t('undo')"
        >
          <UnnnicIcon
            icon="undo"
            clickable
            scheme="neutral-dark"
            size="ant"
            @click="toDeleteIds.splice(toDeleteIds.indexOf(holiday.uuid), 1)"
          />
        </UnnnicToolTip>
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script>
import moment from 'moment';

export default {
  name: 'CustomHolidaysModal',
  props: {
    holidays: {
      type: Array,
      required: true,
    },
  },
  emits: ['close', 'save'],
  data() {
    return {
      toDeleteIds: [],
    };
  },
  methods: {
    getDateFormattedLabel(holiday) {
      const start = moment(holiday.date.start).format('L');
      const end = moment(holiday.date.end).format('L');
      if (start !== end) {
        return `${start} ${this.$t('to')} ${end} ${holiday.repeat ? `- ${this.$t('sector.managers.working_day.repeat_annually')}` : ''}`;
      }
      return `${start} ${holiday.repeat ? `- ${this.$t('sector.managers.working_day.repeat_annually')}` : ''}`;
    },
    save() {
      const filterHolidays = this.holidays.filter(
        (holiday) => !this.toDeleteIds.includes(holiday.uuid),
      );
      this.$emit('save', {
        holidays: filterHolidays,
        toRemove: this.toDeleteIds,
      });
      this.$emit('close');
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
    &__title {
      &--deleted {
        text-decoration: line-through;
      }
    }
  }
}
</style>
