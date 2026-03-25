<template>
  <section
    v-for="(day, dayIndex) in workdayDaysTimeOptions"
    :key="day"
    class="workday-time-config__day"
  >
    <p class="workday-time-config__day__title">
      {{ $t(`week_days.${day}.full`) }}
    </p>
    <section class="workday-time-config__day__time">
      <section
        v-for="(_time, timeIndex) in selectedWorkdayDaysTime[day]"
        :key="`${day}-${timeIndex}`"
      >
        <section class="workday-time-config__day__time__container">
          <section class="workday-time-config__day__time__container-item">
            <UnnnicSelectTime
              v-model="selectedWorkdayDaysTime[day][timeIndex].start"
              class="workday-time-config__day__time__input"
              @update:model-value="emitResetSelectedCopySector"
            />
            <p class="workday-time-config__day__time__to">
              {{ $t('to_the') }}
            </p>
            <UnnnicSelectTime
              v-model="selectedWorkdayDaysTime[day][timeIndex].end"
              class="workday-time-config__day__time__input"
              @update:model-value="emitResetSelectedCopySector"
            />
            <UnnnicButton
              v-if="timeIndex === 0"
              iconCenter="add-1"
              type="tertiary"
              :disabled="selectedWorkdayDaysTime[day].length === 2"
              @click="addTime(day)"
            />

            <UnnnicButton
              v-else-if="timeIndex === 1"
              iconCenter="subtract-1"
              type="tertiary"
              @click="removeTime(day)"
            />
            <UnnnicButton
              v-if="
                dayIndex === 0 &&
                timeIndex === 0 &&
                selectedWorkdayDaysTime[day][0].start &&
                selectedWorkdayDaysTime[day][0].end &&
                workdayDaysTimeOptions.length > 1
              "
              :text="$t('sector.managers.working_day.copy_to_all')"
              iconLeft="copy-paste-1"
              type="tertiary"
              @click="copyToAllDays(day)"
            />
          </section>
          <p
            v-if="
              !selectedWorkdayDaysTime[day][timeIndex].valid &&
              selectedWorkdayDaysTime[day][timeIndex].start &&
              selectedWorkdayDaysTime[day][timeIndex].end
            "
            class="error-message"
          >
            {{
              selectedWorkdayDaysTime[day][timeIndex].start <
              selectedWorkdayDaysTime[day][0]?.end
                ? $t('config_chats.edit_sector.invalid_start_second_hour')
                : $t('config_chats.edit_sector.invalid_hours')
            }}
          </p>
        </section>
      </section>
    </section>
  </section>
</template>

<script>
export default {
  name: 'WorkdayTimeConfig',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    workdayDaysTimeOptions: {
      type: Array,
      required: true,
    },
  },
  emits: ['update:model-value', 'reset-selected-copy-sector'],
  computed: {
    selectedWorkdayDaysTime: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:model-value', value);
      },
    },
  },
  methods: {
    addTime(day) {
      this.selectedWorkdayDaysTime[day]?.push({
        start: '',
        end: '',
        valid: false,
      });
      this.emitResetSelectedCopySector();
    },
    removeTime(day) {
      this.selectedWorkdayDaysTime[day]?.pop();
      this.emitResetSelectedCopySector();
    },
    copyToAllDays(day) {
      const dayValues = this.selectedWorkdayDaysTime[day];
      this.workdayDaysTimeOptions.forEach((day) => {
        this.selectedWorkdayDaysTime[day] = JSON.parse(
          JSON.stringify(dayValues),
        );
      });
    },
    emitResetSelectedCopySector() {
      this.$emit('reset-selected-copy-sector');
    },
  },
};
</script>

<style lang="scss" scoped>
.error-message {
  font-size: $unnnic-font-size-body-md;
  color: $unnnic-color-feedback-red;
}
.workday-time-config {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;
  &__day {
    display: flex;
    align-items: baseline;
    gap: $unnnic-spacing-xs;

    &__time {
      display: flex;
      flex-direction: column;
      gap: $unnnic-spacing-xs;

      &__container {
        display: flex;
        flex-direction: column;
        gap: $unnnic-spacing-xs;
        justify-content: space-between;

        &-item {
          display: flex;
          align-items: center;
          gap: $unnnic-spacing-xs;
        }
      }

      &__input {
        width: 100px;
      }

      &__to {
        font-family: $unnnic-font-family-secondary;
        font-size: $unnnic-font-size-body-md;
        line-height: $unnnic-font-size-body-md + $unnnic-line-height-medium;
        color: $unnnic-color-neutral-cloudy;
      }
    }

    &__title {
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-md;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-medium;
      color: $unnnic-color-neutral-cloudy;
      min-width: 80px;
    }
  }
}
</style>
