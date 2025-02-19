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

    <ul
      v-if="isOpen"
      class="status-bar__list status-bar__list--open"
      data-testid="status-bar-list-open"
    >
      <li
        v-for="status in statuses"
        :key="status.value"
        class="status-bar__item"
        data-testid="status-bar-item"
        @click="selectStatus(status)"
      >
        <section
          class="status-bar__icon"
          data-testid="status-bar-icon-inside"
          :class="`status-bar--${status.color}`"
        ></section>
        <p
          class="status-bar__item-label"
          data-testid="status-bar-item-label"
        >
          {{ status.label }}
        </p>
      </li>
    </ul>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { intervalToDuration, parseISO } from 'date-fns';
import api from '@/services/api/resources/chats/pauseStatus';
import Profile from '@/services/api/resources/profile';
import unnnic from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

const statuses = ref([
  { value: 'active', label: 'Online', color: 'green' },
  { value: 'inactive', label: 'Offline', color: 'gray' },
]);

const selectedStatus = ref(
  sessionStorage.getItem('statusAgent') === 'ONLINE'
    ? statuses.value[0]
    : statuses.value[1],
);
const isOpen = ref(false);
const startDate = ref(null);
const elapsedTime = ref(0);
let intervalId = null;
const configStore = useConfig();
const profileStore = useProfile();
const project = computed(() => configStore.project);
const loadingActiveStatus = ref(false);

const fetchCustomStatuses = async () => {
  const response = await api.getCustomStatusTypeList();
  statuses.value = response;
};

const handleGetActiveStatus = async () => {
  const activeStatus = await configStore.getStatus(configStore.project.uuid);
  configStore.$patch({
    status: activeStatus,
  });
};

const updateActiveStatus = async (isActive) => {
  loadingActiveStatus.value = true;

  const {
    data: { connection_status },
  } = await Profile.updateStatus({
    projectUuid: configStore.project.uuid,
    status: isActive ? 'ONLINE' : 'OFFLINE',
  });

  sessionStorage.setItem('statusAgent', connection_status);

  loadingActiveStatus.value = false;
  showStatusAlert(connection_status.toLowerCase());
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
  if (newStatus.value === selectedStatus.value.value) return;

  const isActiveOrInactive = ['active', 'inactive'].includes(
    selectedStatus.value.value,
  );
  const isCustomStatus = !['active', 'inactive'].includes(newStatus.value);

  if (isActiveOrInactive && isCustomStatus) {
    startDate.value = new Date().toISOString();
    await handleCreateCustomStatus(newStatus);
    startTimer();
  } else if (!isActiveOrInactive && isCustomStatus) {
    await handleCloseCustomStatus(selectedStatus.value, false);
    await handleCreateCustomStatus(newStatus);
    startDate.value = new Date().toISOString();
    startTimer();
  } else if (!isActiveOrInactive && !isCustomStatus) {
    await handleCloseCustomStatus(
      selectedStatus.value,
      newStatus.value === 'active',
    );
    stopTimer();
  }

  if (newStatus.value === 'active' || newStatus.value === 'inactive') {
    updateActiveStatus(newStatus.value === 'active');
  }

  selectedStatus.value = newStatus;
  isOpen.value = false;
};

onMounted(async () => {
  await handleGetActiveStatus();
  await fetchCustomStatuses();
  await getActiveCustomStatusAndActiveTimer();
});

onUnmounted(() => {
  stopTimer();
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const getActiveCustomStatusAndActiveTimer = async () => {
  const activeStatus = await api.getActiveCustomStatus();

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

const handleCloseCustomStatus = async (status, isActive) => {
  const closeStatus = (value) =>
    api.closeCustomStatus({
      statusUuid: value,
      endTime: new Date().toISOString().replace('Z', '+00:00'),
      isActive,
    });

  if (!status.statusUuid) {
    const activeStatus = await api.getActiveCustomStatus();
    if (status.value === activeStatus.status_type) {
      statuses.value = statuses.value.map((state) => ({
        ...state,
        statusUuid:
          state.value === activeStatus.status_type ? activeStatus.uuid : null,
      }));

      return closeStatus(activeStatus.uuid);
    }
  }

  return closeStatus(status.statusUuid);
};

const handleCreateCustomStatus = async (status) => {
  const createStatus = (value) =>
    api.createCustomStatus({
      email: profileStore.me.email,
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

const showStatusAlert = (connectionStatus) => {
  unnnic.unnnicCallAlert({
    props: {
      text: `${i18n.global.t('status_agent')} ${connectionStatus}`,
      icon: 'indicator',
      scheme:
        connectionStatus === 'online'
          ? 'feedback-green'
          : '$unnnic-color-neutral-black',
      closeText: i18n.global.t('close'),
      position: 'bottom-right',
    },
    seconds: 15,
  });
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
