<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('sector.managers.working_day.add_non_working_dates')"
    :primaryButtonProps="{ text: $t('save') }"
    @primary-button-click="save"
    @update:model-value="emitClose"
  >
    <section class="create-custom-holiday-modal__body">
      <section
        v-for="(form, index) in forms"
        :key="index"
        class="create-custom-holiday-modal__form"
      >
        <section class="create-custom-holiday-modal__form__input-date">
          <p class="create-custom-holiday-modal__form__input-date__title">
            {{ $t('sector.managers.working_day.select_date_or_period') }}
          </p>
          <UnnnicInputDatePicker
            v-model="form.date"
            :options="[{ id: 'custom', name: $t('custom') }]"
            next
            fillW
            :actionText="$t('confirm')"
            disableClear
          />
        </section>
        <UnnnicSwitch
          v-model="form.repeat"
          :textRight="$t('sector.managers.working_day.repeat_annually')"
          size="small"
        />
      </section>
      <UnnnicButton
        class="create-custom-holiday-modal__add-button"
        iconCenter="add-1"
        type="tertiary"
        :text="$t('sector.managers.working_day.add_more_dates_or_periods')"
        @click="addForm"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
export default {
  name: 'CreateCustomHolidayModal',
  emits: ['close', 'add-custom-holidays'],
  data() {
    return {
      forms: [{ date: { start: '', end: '' }, repeat: false }],
    };
  },
  methods: {
    emitClose() {
      this.$emit('close');
    },
    addForm() {
      this.forms.push({ date: { start: '', end: '' }, repeat: false });
    },
    save() {
      this.$emit('add-custom-holidays', this.forms);
      this.emitClose();
    },
  },
};
</script>

<style lang="scss" scoped>
.create-custom-holiday-modal {
  &__form {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
    &__input-date {
      &__title {
        margin-bottom: $unnnic-spacing-xs;
      }
    }
  }
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }
}
:deep(.unnnic-button--size-large.create-custom-holiday-modal__add-button) {
  width: 40%;
}

:deep(.dropdown-data) {
  left: 0;
  .unnnic-date-picker {
    position: fixed;
  }
}
</style>
