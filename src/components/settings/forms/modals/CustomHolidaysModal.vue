<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('custom_holidays.title')"
    showCloseIcon
    :primaryButtonProps="{ text: $t('save'), loading: isLoading }"
    @primary-button-click="save"
    @update:model-value="$emit('close')"
  >
    <section class="custom-holidays-modal__body">
      <p>{{ $t('custom_holidays.description') }}</p>
      <UnnnicDisclaimer
        :description="$t('custom_holidays.disclaimer')"
        type="attention"
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
import Sector from '@/services/api/resources/settings/sector';

import unnnic from '@weni/unnnic-system';
import moment from 'moment';

export default {
  name: 'CustomHolidaysModal',
  props: {
    holidays: {
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
  emits: ['close', 'save'],
  data() {
    return {
      toDeleteIds: [],
      isLoading: false,
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
    async save() {
      const removeSuccessIds = [];
      if (this.isEditing) {
        this.isLoading = true;
        try {
          const promises = this.toDeleteIds.map(async (holidayId) => {
            await Sector.deleteSectorHoliday(this.sectorUuid, holidayId);
            removeSuccessIds.push(holidayId);
          });
          await Promise.all(promises);
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('custom_holidays.message.save.success'),
              type: 'success',
            },
          });
        } catch (error) {
          console.log(error);
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('custom_holidays.message.save.error'),
              type: 'error',
            },
          });
        } finally {
          this.isLoading = false;
        }
      }
      const filterHolidays = this.holidays.filter((holiday) =>
        this.isEditing
          ? !removeSuccessIds.includes(holiday.uuid)
          : !this.toDeleteIds.includes(holiday.uuid),
      );
      this.$emit('save', {
        holidays: filterHolidays,
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
