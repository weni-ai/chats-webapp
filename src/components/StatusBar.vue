<template>
  <header class="status-bar">
    <section
      class="status-bar__selected"
      @click="toggleDropdown"
    >
      <section class="status-bar__content">
        <section
          class="status-bar__icon"
          :style="{ backgroundColor: selectedStatus.color }"
        ></section>
        <p class="status-bar__label">{{ selectedStatus.label }}</p>
        <section
          v-if="
            project.config?.can_see_timer && selectedStatus.value !== 'inactive'
          "
          class="status-bar__timer"
        >
          {{ formattedTime }}
        </section>
      </section>
      <section class="status-bar__set-status">
        <p class="status-bar__set-status__label">
          {{ $t('status.set_status') }}
        </p>
        <UnnnicIcon
          data-testid="header-icon-expand"
          size="md"
          :icon="isOpen ? 'expand_less' : 'expand_more'"
          scheme="neutral-darkest"
        />
      </section>
    </section>

    <ul
      v-if="isOpen"
      class="status-bar__list status-bar__list--open"
    >
      <li
        v-for="status in statuses"
        :key="status.value"
        class="status-bar__item"
        @click="selectStatus(status)"
      >
        <section
          class="status-bar__icon"
          :style="{ backgroundColor: status.color }"
        ></section>
        <p class="status-bar__item-label">{{ status.label }}</p>
      </li>
    </ul>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useConfig } from '@/store/modules/config';
import { format, intervalToDuration, parseISO } from 'date-fns';
import i18n from '@/plugins/i18n';

const statuses = ref([
  { value: 'active', label: 'Online', color: 'green' },
  { value: 'inactive', label: 'Offline', color: 'gray' },
  { value: 'pending', label: 'Almoço', color: 'orange' },
  { value: 'lunch', label: 'Lanche', color: 'brown' },
]);

const configStore = useConfig();
const project = computed(() => configStore.project);

const selectedStatus = ref(statuses.value[1]);
const isOpen = ref(false);
const startDate = ref(null);
const elapsedTime = ref(0);
let intervalId = null;

const mockApiRequest = (url, data) => {
  console.log(`📡 Mock API Request to: ${url}`, data);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

const getLocaleDate = () => {
  const locale = i18n.global.locale ?? 'en-US';
  if (locale) return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");
};

const startTimer = () => {
  intervalId = setInterval(() => {
    if (startDate.value) {
      const duration = intervalToDuration({
        start: parseISO(startDate.value),
        end: new Date(),
      });
      elapsedTime.value = duration;
    }
  }, 1000);
};

const stopTimer = () => {
  if (intervalId) clearInterval(intervalId);
};

const formattedTime = computed(() => {
  if (!elapsedTime.value) return '00:00:00';
  const { hours = 0, minutes = 0, seconds = 0 } = elapsedTime.value;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const selectStatus = async (newStatus) => {
  if (newStatus.value !== 'inactive') {
    if (selectedStatus.value.value !== 'inactive') {
      await mockApiRequest('/api/status/end', {
        status_id: selectedStatus.value.value,
        end_date: getLocaleDate(),
      });
    }

    startDate.value = getLocaleDate();
    await mockApiRequest('/api/status/start', {
      status_id: newStatus.value,
      start_date: startDate.value,
    });

    startTimer();
  } else {
    stopTimer();
  }

  selectedStatus.value = newStatus;
  isOpen.value = false;
};

onMounted(() => {
  if (!startDate.value && project.value) {
    startDate.value = getLocaleDate();
  }

  if (selectedStatus.value.value !== 'inactive') {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};
</script>

<style lang="scss" scoped>
.status-bar {
  position: relative;
  display: flex;
  padding: $unnnic-spacing-sm;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $unnnic-color-neutral-soft;
  border-left: 1px solid $unnnic-color-neutral-soft;
  background: $unnnic-color-neutral-white;
  cursor: pointer;

  &__selected {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $unnnic-spacing-xs;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: $unnnic-border-radius-md;
  }

  &__icon {
    width: $unnnic-spacing-xs;
    height: $unnnic-spacing-xs;
    border-radius: 50%;
  }

  &__timer {
    display: flex;
    padding: 0rem $unnnic-border-radius-md;
    justify-content: center;
    align-items: center;
    gap: $unnnic-spacing-xs;
    border-radius: $unnnic-border-radius-pill;
    border: 1px solid $unnnic-color-neutral-clean;
    color: $unnnic-color-neutral-clean;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-md;
    font-style: normal;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
  }

  &__label {
    color: $unnnic-color-neutral-dark;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }

  &__set-status {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-nano;
    &__label {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-md;
      font-style: normal;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    }
  }

  &__list {
    position: absolute;
    width: 100%;
    background: $unnnic-color-background-snow;
    border-top: 1px solid $unnnic-color-neutral-soft;
    list-style: none;
    margin: 0;
    top: 100%;
    left: 0;
    z-index: 9999999;

    &--open {
      display: block;
    }
  }

  &__item {
    padding: $unnnic-spacing-sm;
    display: flex;
    align-items: center;
    border-bottom: 1px solid $unnnic-color-neutral-soft;
    gap: $unnnic-border-radius-md;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: $unnnic-color-neutral-lightest;
    }

    &-label {
      color: $unnnic-color-neutral-dark;

      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }
}
</style>
