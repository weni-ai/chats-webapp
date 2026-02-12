<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('sector.managers.working_day.add_non_working_dates')"
    :primaryButtonProps="{ text: $t('save'), loading: isLoading }"
    @primary-button-click="save"
    @update:model-value="emitClose"
  >
    <section class="create-custom-holiday-modal__body">
      <section
        v-for="(form, index) in forms"
        :key="index"
        class="create-custom-holiday-modal__form"
        data-testid="create-custom-holiday-form"
      >
        <section class="create-custom-holiday-modal__form__input-date">
          <p class="create-custom-holiday-modal__form__input-date__title">
            {{ $t('sector.managers.working_day.select_date_or_period') }}
          </p>
          <UnnnicInputDatePicker
            v-model="form.date"
            hideOptions
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
import Sector from '@/services/api/resources/settings/sector';
import unnnic from '@weni/unnnic-system';

export default {
  name: 'CreateCustomHolidayModal',
  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    sectorUuid: {
      type: String,
      default: '',
    },
  },
  emits: ['close', 'add-custom-holidays'],
  data() {
    return {
      isLoading: false,
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
    async save() {
      this.isLoading = true;
      if (this.isEditing) {
        try {
          const promises = this.forms
            .filter((form) => !!form.date.start)
            .map(async (form) => {
              const response = await Sector.createSectorHoliday(
                this.sectorUuid,
                form,
              );
              form.uuid = response.uuid;
              form.success = true;
            });
          await Promise.all(promises);
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t(
                'sector.managers.working_day.message.create_custom_holiday.success',
              ),
              type: 'success',
            },
          });
        } catch (error) {
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t(
                'sector.managers.working_day.message.create_custom_holiday.error',
              ),
              type: 'error',
            },
          });
        } finally {
          this.isLoading = false;
          this.forms = this.forms.filter((form) => form.success);
        }
      }
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
  width: 50%;
}
</style>
