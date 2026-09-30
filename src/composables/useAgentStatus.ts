import { computed, ref } from 'vue';

import { UnnnicCallAlert } from '@weni/unnnic-system';

import api from '@/services/api/resources/chats/pauseStatus';
import Profile from '@/services/api/resources/profile';
import i18n from '@/plugins/i18n';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { moduleStorage } from '@/utils/storage';

export interface AgentStatus {
  value: string;
  label: string;
  color: string;
  statusUuid?: string | null;
}

export interface StatusAlertPayload {
  props: {
    text: string;
    icon: string;
    scheme: string;
    closeText: string;
    position: string;
  };
  seconds: number;
}

export interface UseAgentStatusOptions {
  notify?: (_payload: StatusAlertPayload) => void;
  setStartDate?: (_date: string) => void;
  startTimer?: () => void;
  stopTimer?: () => void;
  onStatusApplied?: () => void;
}

const CONNECTION_STATUS = {
  active: 'active',
  inactive: 'inactive',
} as const;

function isConnectionStatus(value: string) {
  return (
    value === CONNECTION_STATUS.active || value === CONNECTION_STATUS.inactive
  );
}

function withConnectionLabels(list: AgentStatus[] | undefined): AgentStatus[] {
  return (list ?? []).map((status) => {
    if (status.value === CONNECTION_STATUS.active) {
      return { ...status, label: i18n.global.t('status.online') };
    }
    if (status.value === CONNECTION_STATUS.inactive) {
      return { ...status, label: i18n.global.t('status.offline') };
    }
    return status;
  });
}

function projectUuidFrom(project: { uuid?: string } | undefined) {
  return project?.uuid;
}

export function useAgentStatus(options: UseAgentStatusOptions = {}) {
  const profileStore = useProfile();
  const configStore = useConfig();

  const notify =
    options.notify ??
    ((payload: StatusAlertPayload) => {
      UnnnicCallAlert(payload);
    });

  const statuses = ref<AgentStatus[]>(
    withConnectionLabels([
      { value: 'active', label: 'Online', color: 'green' },
      { value: 'inactive', label: 'Offline', color: 'gray' },
    ]),
  );

  const projectUuid = projectUuidFrom(configStore.project as { uuid?: string });

  const statusAgentKey = projectUuid
    ? `statusAgent-${projectUuid}`
    : `statusAgent-${moduleStorage.getItem('projectUuid', '', {
        useSession: true,
      })}`;

  const selectedStatus = ref<AgentStatus>(
    moduleStorage.getItem(statusAgentKey, '', {
      useSession: true,
    }) === 'ONLINE'
      ? statuses.value[0]
      : statuses.value[1],
  );

  const filteredStatuses = computed(() => {
    return statuses.value.filter(
      (status) => status.value !== selectedStatus.value?.value,
    );
  });

  const isUpdatingStatus = ref(false);

  const showStatusAlert = (
    status: AgentStatus | undefined,
    isSuccess = true,
  ) => {
    const scheme = {
      inactive: 'fg-emphasized',
      error: 'feedback-red',
      default: 'feedback-green',
    };

    const schemeKey = status?.value as keyof typeof scheme;
    const schemeStatus = isSuccess
      ? scheme[schemeKey] || scheme.default
      : scheme.error;

    notify({
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

  const fetchCustomStatuses = async () => {
    const response = await api.getCustomStatusTypeList({
      projectUuid: projectUuidFrom(configStore.project as { uuid?: string }),
    });
    statuses.value = withConnectionLabels(response);
  };

  const handleGetActiveStatus = async () => {
    const activeStatus = await configStore.getStatus(
      projectUuidFrom(configStore.project as { uuid?: string }),
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
    try {
      let connection_status: string | null = null;
      const statusAgent = isActive ? 'ONLINE' : 'OFFLINE';

      if (!skipRequest) {
        const {
          data: { connection_status: connection },
        } = await Profile.updateStatus({
          projectUuid: projectUuidFrom(
            configStore.project as { uuid?: string },
          ),
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

      configStore.setStatus(statusAgent);

      const status = statuses.value.find(
        (item) =>
          item.value ===
          (connection_status === 'online' ? 'active' : 'inactive'),
      );
      showStatusAlert(status, true);
    } catch (e) {
      console.error('Error to update active/inactive status', e);
      showStatusAlert(selectedStatus.value, false);
    }
  };

  const getActiveCustomStatusAndActiveTimer = async () => {
    const activeStatus = await api.getActiveCustomStatus({
      projectUuid: projectUuidFrom(configStore.project as { uuid?: string }),
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

      options.setStartDate?.(activeStatus.created_on);
      options.startTimer?.();
    }
  };

  const handleCloseCustomStatus = async (
    _status: AgentStatus,
    isActive: boolean,
  ) => {
    const closeStatus = (value: string) =>
      api.closeCustomStatus({
        statusUuid: value,
        endTime: new Date().toISOString().replace('Z', '+00:00'),
        isActive,
      });

    const activeStatus = await api.getActiveCustomStatus({
      projectUuid: projectUuidFrom(configStore.project as { uuid?: string }),
    });

    if (!activeStatus) {
      return null;
    }

    return closeStatus(activeStatus.uuid);
  };

  const handleCreateCustomStatus = async (status: AgentStatus) => {
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

  const selectStatus = async (newStatus: AgentStatus) => {
    if (newStatus.value === selectedStatus.value.value) return;

    const isOldStatusActiveOrInactive = isConnectionStatus(
      selectedStatus.value.value,
    );
    const isCustomStatus = !isConnectionStatus(newStatus.value);

    isUpdatingStatus.value = true;
    try {
      if (isOldStatusActiveOrInactive && isCustomStatus) {
        options.setStartDate?.(new Date().toISOString());
        const wasActive =
          selectedStatus.value.value === CONNECTION_STATUS.active;
        await handleCreateCustomStatus(newStatus);
        if (wasActive) {
          moduleStorage.setItem(statusAgentKey, 'OFFLINE', {
            useSession: true,
          });
          configStore.setStatus('OFFLINE');
        }
        options.startTimer?.();
      } else if (!isOldStatusActiveOrInactive && isCustomStatus) {
        await handleCloseCustomStatus(selectedStatus.value, false);
        await handleCreateCustomStatus(newStatus);
        options.setStartDate?.(new Date().toISOString());
        options.startTimer?.();
      } else if (!isOldStatusActiveOrInactive && !isCustomStatus) {
        await handleCloseCustomStatus(
          selectedStatus.value,
          newStatus.value === CONNECTION_STATUS.active,
        );
        if (newStatus.value === CONNECTION_STATUS.active) {
          await updateActiveStatus({
            isActive: true,
            skipRequest: false,
          });
        }
        options.stopTimer?.();
      }

      if (
        newStatus.value === CONNECTION_STATUS.active ||
        newStatus.value === CONNECTION_STATUS.inactive
      ) {
        await updateActiveStatus({
          isActive: newStatus.value === CONNECTION_STATUS.active,
          skipRequest: !isConnectionStatus(selectedStatus.value.value),
        });
      } else {
        showStatusAlert(newStatus, true);
      }

      selectedStatus.value = newStatus;
      options.onStatusApplied?.();
    } catch (e) {
      console.error('Error updating status:', e);
      showStatusAlert(selectedStatus.value, false);
    } finally {
      isUpdatingStatus.value = false;
    }
  };

  const refreshData = async () => {
    await handleGetActiveStatus();
    await fetchCustomStatuses();
    await getActiveCustomStatusAndActiveTimer();
  };

  return {
    statuses,
    selectedStatus,
    filteredStatuses,
    isUpdatingStatus,
    statusAgentKey,
    fetchCustomStatuses,
    selectStatus,
    showStatusAlert,
    updateActiveStatus,
    refreshData,
  };
}
