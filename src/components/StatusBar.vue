<template>
  <header
    class="status-bar"
    data-testid="status-bar"
  >
    <section
      class="status-bar__selected"
      data-testid="status-bar-selected"
      @click="toggleDropdown"
    >
      <section class="status-bar__content">
        <section
          class="status-bar__icon"
          data-testid="status-bar-icon"
          :class="`status-bar--${selectedStatus.color}`"
        ></section>
        <p
          class="status-bar__label"
          data-testid="selected-status-label"
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
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { intervalToDuration, parseISO, type Duration } from 'date-fns';
import api from '@/services/api/resources/chats/pauseStatus';
import Profile from '@/services/api/resources/profile';
import unnnic from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';
import { moduleStorage } from '@/utils/storage';
import { storeToRefs } from 'pinia';

interface Status {
  value: string;
  label: string;
  color: string;
  statusUuid?: string | null;
}

const statuses = ref<Status[]>([
  { value: 'active', label: 'Online', color: 'green' },
  { value: 'inactive', label: 'Offline', color: 'gray' },
]);

const filteredStatuses = computed(() => {
  return statuses.value.filter(
    (status) => status.value !== selectedStatus.value?.value,
  );
});

const isOpen = ref(false);
const startDate = ref<string | null>(null);
const elapsedTime = ref<Duration | number>(0);
let intervalId: ReturnType<typeof setInterval> | null = null;
const configStore = useConfig();
const { status: configStatus, customStatus: configCustomStatus } =
  storeToRefs(configStore);

const statusAgentKey = (configStore.project as unknown as { uuid: string })
  ?.uuid
  ? `statusAgent-${(configStore.project as unknown as { uuid: string })?.uuid}`
  : `statusAgent-${moduleStorage.getItem('projectUuid', '', {
      useSession: true,
    })}`;

const selectedStatus = ref<Status>(
  moduleStorage.getItem(statusAgentKey, '', {
    useSession: true,
  }) === 'ONLINE'
    ? statuses.value[0]
    : statuses.value[1],
);

const profileStore = useProfile();
const project = computed(() => configStore.project);
const loadingActiveStatus = ref(false);
const isToggling = ref(false);

const handleClickOutside = (event: MouseEvent) => {
  if (isToggling.value) return;

  const target = event.target as HTMLElement;
  const statusBar = target.closest('[class="status-bar"]');
  if (!statusBar && isOpen.value) {
    isOpen.value = false;
  }
};

const fetchCustomStatuses = async () => {
  const response = await api.getCustomStatusTypeList({
    projectUuid: (configStore.project as unknown as { uuid: string })?.uuid,
  });
  statuses.value = response;
};

const handleGetActiveStatus = async () => {
  const activeStatus = await configStore.getStatus(
    (configStore.project as unknown as { uuid: string })?.uuid,
  );
  configStore.$patch({
    status: activeStatus,
  });
};

const updateActiveStatus = async ({
  isActive,
  skipRequest,
}: {
  isActive: boolean;
  skipRequest: boolean;
}) => {
  loadingActiveStatus.value = true;
  try {
    let connection_status: string | null = null;
    const statusAgent = isActive ? 'ONLINE' : 'OFFLINE';

    if (!skipRequest) {
      const {
        data: { connection_status: connection },
      } = await Profile.updateStatus({
        projectUuid: (configStore.project as unknown as { uuid: string })?.uuid,
        status: statusAgent,
      });

      moduleStorage.setItem(statusAgentKey, connection, {
        useSession: true,
      });
      connection_status = connection.toLowerCase();
    } else {
      connection_status = statusAgent.toLowerCase();
      moduleStorage.setItem(statusAgentKey, statusAgent, {
        useSession: true,
      });
    }

    const status = statuses.value.find(
      (s) =>
        s.value === (connection_status === 'online' ? 'active' : 'inactive'),
    );
    showStatusAlert(status, true);
  } catch (e) {
    console.error('Error to update active/inactive status', e);
    showStatusAlert(selectedStatus.value, false);
  } finally {
    loadingActiveStatus.value = false;
  }
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
  if (!elapsedTime.value || typeof elapsedTime.value === 'number')
    return '00:00:00';

  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = elapsedTime.value;

  // Convert days to hours and add to existing hours
  const totalHours = days * 24 + hours;

  return `${String(totalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const selectStatus = async (newStatus: Status) => {
  if (newStatus.value === selectedStatus.value.value) return;

  const isOldStatusActiveOrInactive = ['active', 'inactive'].includes(
    selectedStatus.value.value,
  );
  const isCustomStatus = !['active', 'inactive'].includes(newStatus.value);

  try {
    if (isOldStatusActiveOrInactive && isCustomStatus) {
      startDate.value = new Date().toISOString();
      const wasActive = selectedStatus.value.value === 'active';
      await handleCreateCustomStatus(newStatus);
      if (wasActive) {
        moduleStorage.setItem(statusAgentKey, 'OFFLINE', {
          useSession: true,
        });
      }
      startTimer();
    } else if (!isOldStatusActiveOrInactive && isCustomStatus) {
      await handleCloseCustomStatus(selectedStatus.value, false);
      await handleCreateCustomStatus(newStatus);
      startDate.value = new Date().toISOString();
      startTimer();
    } else if (!isOldStatusActiveOrInactive && !isCustomStatus) {
      await handleCloseCustomStatus(
        selectedStatus.value,
        newStatus.value === 'active',
      );
      if (newStatus.value === 'active') {
        updateActiveStatus({
          isActive: true,
          skipRequest: false,
        });
      }
      stopTimer();
    }

    if (newStatus.value === 'active' || newStatus.value === 'inactive') {
      updateActiveStatus({
        isActive: newStatus.value === 'active',
        skipRequest: !['active', 'inactive'].includes(
          selectedStatus.value.value,
        ),
      });
    } else {
      showStatusAlert(newStatus, true);
    }

    selectedStatus.value = newStatus;
    isOpen.value = false;
  } catch (e) {
    console.error('Error updating status:', e);
    showStatusAlert(selectedStatus.value, false);
  }
};

const refreshData = async () => {
  await handleGetActiveStatus();
  await fetchCustomStatuses();
  await getActiveCustomStatusAndActiveTimer();
};

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

const getActiveCustomStatusAndActiveTimer = async () => {
  const activeStatus = await api.getActiveCustomStatus({
    projectUuid: (configStore.project as unknown as { uuid: string })?.uuid,
  });

  if (activeStatus?.status_type && activeStatus.is_active) {
    statuses.value = statuses.value.map((status) => ({
      ...status,
      statusUuid:
        status.value === activeStatus.status_type ? activeStatus.uuid : null,
    }));

    selectedStatus.value =
      statuses.value.find(
        (status) => status.value === activeStatus.status_type,
      ) || selectedStatus.value;

    startDate.value = activeStatus.created_on;
    startTimer();
  }
};

const handleCloseCustomStatus = async (status: Status, isActive: boolean) => {
  const closeStatus = (value) =>
    api.closeCustomStatus({
      statusUuid: value,
      endTime: new Date().toISOString().replace('Z', '+00:00'),
      isActive,
    });

  const activeStatus = await api.getActiveCustomStatus({
    projectUuid: (configStore.project as unknown as { uuid: string })?.uuid,
  });

  if (!activeStatus) {
    // No active status found, nothing to close
    return null;
  }

  return closeStatus(activeStatus.uuid);
};

const handleCreateCustomStatus = async (status: Status) => {
  const createStatus = (value: string) =>
    api.createCustomStatus({
      email: (profileStore?.me as { email: string })?.email || '',
      statusType: value,
    });

  const response = await createStatus(status.value);

  if (!status.statusUuid) {
    statuses.value = statuses.value.map((state) => ({
      ...state,
      statusUuid: state.value === response.status_type ? response.uuid : null,
    }));
  }

  return response;
};

const showStatusAlert = (status: Status | undefined, isSuccess = true) => {
  const scheme = {
    inactive: '$unnnic-color-neutral-black',
    error: 'feedback-red',
    default: 'feedback-green',
  };

  const schemeKey = status?.value as keyof typeof scheme;
  const schemeStatus = isSuccess
    ? scheme[schemeKey] || scheme.default
    : scheme.error;

  unnnic.unnnicCallAlert({
    props: {
      text: isSuccess
        ? i18n.global.t('status-bar.success', { status: status?.label })
        : i18n.global.t('status-bar.error'),
      icon: 'indicator',
      scheme: schemeStatus,
      closeText: i18n.global.t('close'),
      position: 'bottom-right',
    },
    seconds: 15,
  });
};

watch(
  () => configStatus?.value,
  (newStatus) => {
    if (
      newStatus === 'OFFLINE' &&
      moduleStorage.getItem(statusAgentKey, '', {
        useSession: true,
      }) === 'OFFLINE'
    ) {
      selectedStatus.value = statuses.value[1];
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
  max-height: 300px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
  opacity: 1;
  overflow: hidden;
}

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
  margin-bottom: $unnnic-spacing-ant;

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
  }

  &__icon {
    width: $unnnic-spacing-xs;
    height: $unnnic-spacing-xs;
    border-radius: 50%;
    background-color: $unnnic-color-neutral-cleanest;
  }

  &--green {
    background-color: $unnnic-color-aux-green-300;
  }

  &--gray {
    background-color: $unnnic-color-neutral-cleanest;
  }

  &--brown {
    background-color: $unnnic-color-aux-orange-500;
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
    width: calc(100% - $unnnic-space-7);
    background: $unnnic-color-background-snow;
    border-top: 1px solid $unnnic-color-neutral-soft;
    list-style: none;
    margin: 0;
    margin-top: -$unnnic-space-4;
    padding: $unnnic-space-4;
    top: 100%;
    left: $unnnic-space-4;
    z-index: 9999999;
    box-shadow: $unnnic-shadow-1;
    border-radius: $unnnic-radius-4;

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

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: $unnnic-color-neutral-lightest;
      border-radius: $unnnic-radius-1;
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
