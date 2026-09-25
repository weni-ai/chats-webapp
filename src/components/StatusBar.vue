<template>
  <header
    class="status-bar"
    data-testid="status-bar"
  >
    <section
      class="status-bar__selected"
      data-testid="status-bar-selected"
    >
      <section
        class="status-bar__content"
        @click="toggleDropdown"
      >
        <section
          class="status-bar__icon"
          data-testid="status-bar-icon"
          :class="`status-bar--${selectedStatus.color}`"
        />
        <p
          class="status-bar__label"
          data-testid="selected-status-label"
          :title="selectedStatus.label"
        >
          {{ selectedStatus.label }}
        </p>
        <section
          v-if="
            project.config?.can_see_timer &&
            !['inactive', 'active'].includes(selectedStatus.value)
          "
          class="status-bar__timer"
          data-testid="status-bar-timer"
        >
          {{ formattedTime }}
        </section>
        <UnnnicIcon
          data-testid="header-icon-expand"
          size="md"
          :icon="isOpen ? 'expand_less' : 'expand_more'"
          scheme="fg-base"
        />
      </section>
      <section
        v-if="
          !isMobile() &&
          !isUserAdmin &&
          project.config?.can_use_queue_prioritization
        "
        class="status-bar__queue-priorization"
        @click="isOpenModalQueuePriorizations = true"
      >
        <p class="status-bar__queue-priorization__title">
          {{ $t('chats.assigned_queues') }}
        </p>
        <UnnnicIcon
          icon="edit_square"
          size="ant"
          scheme="fg-base"
        />
      </section>
    </section>
    <Transition name="expand">
      <ul
        v-if="isOpen"
        class="status-bar__list status-bar__list--open"
        data-testid="status-bar-list-open"
      >
        <li
          v-for="status in filteredStatuses"
          :key="status.value"
          class="status-bar__item"
          data-testid="status-bar-item"
          @click="selectStatus(status)"
        >
          <section
            class="status-bar__icon"
            data-testid="status-bar-icon-inside"
            :class="`status-bar--${status.color}`"
          />
          <p
            class="status-bar__item-label"
            data-testid="status-bar-item-label"
          >
            {{ status.label }}
          </p>
        </li>
      </ul>
    </Transition>
    <ModalQueuePriorizations
      v-if="isOpenModalQueuePriorizations"
      v-model="isOpenModalQueuePriorizations"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { intervalToDuration, parseISO, type Duration } from 'date-fns';
import isMobile from 'is-mobile';

import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';

import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

import { moduleStorage } from '@/utils/storage';
import { useAgentStatus } from '@/composables/useAgentStatus';

const profileStore = useProfile();
const configStore = useConfig();
const { status: configStatus, customStatus: configCustomStatus } =
  storeToRefs(configStore);

const isOpenModalQueuePriorizations = ref(false);

const isUserAdmin = computed(() => {
  const ROLE_ADMIN = 1;
  return profileStore.me.project_permission_role === ROLE_ADMIN;
});

const isOpen = ref(false);
const startDate = ref<string | null>(null);
const elapsedTime = ref<Duration | number>(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

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

const {
  statuses,
  selectedStatus,
  filteredStatuses,
  fetchCustomStatuses,
  selectStatus,
  showStatusAlert,
  updateActiveStatus,
  refreshData,
  statusAgentKey,
} = useAgentStatus({
  setStartDate: (date) => {
    startDate.value = date;
  },
  startTimer,
  stopTimer,
  onStatusApplied: () => {
    isOpen.value = false;
  },
});

// Referenced so the status actions stay on the instance the tests call.
void fetchCustomStatuses;
void showStatusAlert;
void updateActiveStatus;

const project = computed(() => configStore.project);
const isToggling = ref(false);

const handleClickOutside = (event: MouseEvent) => {
  if (isToggling.value) return;

  const target = event.target as HTMLElement;
  const statusBar = target.closest('[class="status-bar"]');
  if (!statusBar && isOpen.value) {
    isOpen.value = false;
  }
};

const formattedTime = computed(() => {
  if (!elapsedTime.value || typeof elapsedTime.value === 'number')
    return '00:00:00';

  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = elapsedTime.value;

  // Convert days to hours and add to existing hours
  const totalHours = days * 24 + hours;

  return `${String(totalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

let settingsCheckInterval: ReturnType<typeof setInterval> | null = null;

const checkSettingsUpdates = () => {
  const currentSettingsUpdate = moduleStorage.getItem('settingsUpdated');
  const lastSettingsUpdate = moduleStorage.getItem('lastSettingsUpdate', '0', {
    useSession: true,
  });

  if (currentSettingsUpdate && currentSettingsUpdate !== lastSettingsUpdate) {
    moduleStorage.setItem('lastSettingsUpdate', currentSettingsUpdate, {
      useSession: true,
    });
    refreshData();
  }
};

onMounted(() => {
  refreshData();
  document.addEventListener('click', handleClickOutside);

  const initialValue = moduleStorage.getItem('settingsUpdated', '0');
  moduleStorage.setItem('lastSettingsUpdate', initialValue, {
    useSession: true,
  });
  settingsCheckInterval = setInterval(checkSettingsUpdates, 1000);
});

onUnmounted(() => {
  stopTimer();
  document.removeEventListener('click', handleClickOutside);

  if (settingsCheckInterval) {
    clearInterval(settingsCheckInterval);
  }
});

const toggleDropdown = (event?: MouseEvent) => {
  if (isToggling.value) return;

  if (event) {
    event.stopPropagation();
  }

  isToggling.value = true;

  isOpen.value = !isOpen.value;

  setTimeout(() => {
    isToggling.value = false;
  }, 200);
};

watch(
  () => configStatus?.value,
  (newStatus) => {
    if (
      newStatus === 'OFFLINE' &&
      configStore.socketClosedOffline &&
      moduleStorage.getItem(statusAgentKey, '', {
        useSession: true,
      }) === 'OFFLINE'
    ) {
      selectedStatus.value = statuses.value[1];
      configStore.setSocketClosedOffline(false);
    }
  },
);

watch(
  () => configCustomStatus?.value,
  (newStatus) => {
    if (newStatus === 'CUSTOM') {
      selectedStatus.value = statuses.value[1];
    }
  },
);
</script>

<style lang="scss" scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 80vh;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 80vh;
  opacity: 1;
  overflow: hidden;
}

.status-bar {
  position: relative;
  display: flex;
  padding: $unnnic-spacing-sm;
  min-height: var(--chats-column-header-height, 57px);
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $unnnic-color-border-soft;
  border-left: 1px solid $unnnic-color-border-soft;
  background: $unnnic-color-bg-base;
  margin-bottom: $unnnic-spacing-ant;

  &__queue-priorization {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    cursor: pointer;
    &__title {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-base;
    }
  }

  &__selected {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: $unnnic-border-radius-md;
    cursor: pointer;
  }

  &__icon {
    width: $unnnic-spacing-xs;
    height: $unnnic-spacing-xs;
    border-radius: 50%;
    background-color: $unnnic-color-fg-base;
  }

  &--green {
    background-color: $unnnic-color-bg-green-strong;
  }

  &--gray {
    background-color: $unnnic-color-bg-muted;
  }

  &--brown {
    background-color: $unnnic-color-bg-orange-strong;
  }

  &__timer {
    display: flex;
    padding: 0rem $unnnic-border-radius-md;
    justify-content: center;
    align-items: center;
    gap: $unnnic-spacing-xs;
    border-radius: $unnnic-border-radius-pill;
    border: 1px solid $unnnic-color-border-soft;
    color: $unnnic-color-fg-base;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-md;
    font-style: normal;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
  }

  &__label {
    color: $unnnic-color-fg-base;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;

    &__set-status {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-nano;
      &__label {
        color: $unnnic-color-fg-base;
        font-family: $unnnic-font-family-secondary;
        font-size: $unnnic-font-size-body-gt;
        font-style: normal;
        font-weight: $unnnic-font-weight-bold;
        line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
      }
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 100px;
    }
  }

  &__list {
    position: absolute;
    width: calc(100% - $unnnic-space-7);
    background: $unnnic-color-bg-base;
    border-top: 1px solid $unnnic-color-border-soft;
    list-style: none;
    margin: 0;
    margin-top: -$unnnic-space-4;
    padding: $unnnic-space-4;
    top: 100%;
    left: $unnnic-space-4;
    z-index: 9999999;
    box-shadow: $unnnic-shadow-1;
    border-radius: $unnnic-radius-4;
    max-height: 80vh;
    overflow-y: auto;
    padding-right: $unnnic-inline-xs;
    scrollbar-width: thin;
    scrollbar-color: $unnnic-color-border-soft $unnnic-color-bg-base-soft;

    &::-webkit-scrollbar {
      width: $unnnic-spacing-inline-nano;
    }

    &::-webkit-scrollbar-thumb {
      background: $unnnic-color-border-soft;
      border-radius: $unnnic-border-radius-pill;
    }

    &::-webkit-scrollbar-track {
      background: $unnnic-color-bg-base-soft;
      border-radius: $unnnic-border-radius-pill;
    }

    &--open {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-2;
    }
  }

  &__item {
    padding: $unnnic-space-2;
    display: flex;
    align-items: center;
    gap: $unnnic-border-radius-md;
    flex-shrink: 0;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: $unnnic-color-bg-base-soft;
      border-radius: $unnnic-radius-1;
    }

    &-label {
      color: $unnnic-color-fg-base;

      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }
}
</style>
