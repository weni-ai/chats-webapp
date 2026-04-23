<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="create-custom-holiday-modal"
    data-testid="modal-dialog"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle data-testid="modal-title">
          {{ $t('sector.managers.working_day.add_non_working_dates') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
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
          data-testid="add-button"
          iconCenter="add-1"
          type="tertiary"
          :text="$t('sector.managers.working_day.add_more_dates_or_periods')"
          @click="addForm"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          data-testid="modal-close"
          :disabled="isLoading"
          @click="close"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          data-testid="primary-button"
          :disabled="isLoading"
          :loading="isLoading"
          @click="save"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
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
      isOpen: true,
      forms: [{ date: { start: '', end: '' }, repeat: false }],
    };
  },
  watch: {
    isOpen(value) {
      if (!value) {
        this.$emit('close');
      }
    },
  },
  methods: {
    close() {
      this.isOpen = false;
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
      this.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.create-custom-holiday-modal {
  &__form {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    &__input-date {
      &__title {
        margin-bottom: $unnnic-space-1;
      }
    }
  }
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
    overflow-y: auto;
  }
}
:deep(.unnnic-button--size-large.create-custom-holiday-modal__add-button) {
  width: 50%;
}
</style>
