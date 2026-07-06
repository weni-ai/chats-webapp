<template>
  <main
    class="rooms-transfer__select-destination"
    :class="{ small: size === 'sm' }"
  >
    <section class="select-destination__field">
      <UnnnicSelect
        v-model="selectedQueueOption"
        data-testid="select-queue"
        :size="size"
        :options="queues"
        :label="size !== 'sm' ? $t('queue') : undefined"
        :placeholder="$t('select_queue')"
        returnObject
        clearable
        enableSearch
        :search="searchQueue"
        @update:search="searchQueue = $event"
      />
    </section>
    <section class="select-destination__field">
      <UnnnicSelect
        v-model="selectedAgent"
        data-testid="select-agent"
        :size="size"
        :disabled="isAgentsFieldDisabled"
        :options="sortedAgents"
        :label="size !== 'sm' ? $t('representative') : undefined"
        :placeholder="$t('select_representative')"
        returnObject
        clearable
        enableSearch
        :search="searchAgent"
        @update:search="searchAgent = $event"
      >
        <template #option="{ label, option }">
          <span
            class="select-destination__agent-label"
            data-testid="agent-option"
          >
            {{ label }}
          </span>
          <UnnnicTag
            data-testid="agent-status-tag"
            type="default"
            size="small"
            :data-status="option.status"
            :text="getAgentStatusLabel(option.status)"
            :scheme="getAgentStatusScheme(option.status)"
          />
        </template>
        <template #selected="{ label, option }">
          <span class="select-destination__agent-label">
            {{ label }}
          </span>
          <UnnnicTag
            type="default"
            size="small"
            :text="getAgentStatusLabel(option.status)"
            :scheme="getAgentStatusScheme(option.status)"
          />
        </template>
      </UnnnicSelect>
    </section>
    <UnnnicDisclaimer
      v-if="showTransferDisclaimer"
      data-testid="transfer-disclaimer"
      :class="[
        'select-destination__disclaimer',
        { 'select-destination__disclaimer--small': size === 'sm' },
      ]"
      :description="transferDisclaimerText"
      type="error"
    />
    <UnnnicDisclaimer
      v-if="showTransferToOtherSectorDisclaimer"
      data-testid="transfer-other-queue-disclaimer"
      :class="[
        'select-destination__disclaimer',
        { 'select-destination__disclaimer--small': size === 'sm' },
      ]"
      :description="$t('bulk_transfer.disclaimer.transfer_to_other_sector')"
      type="attention"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import isMobile from 'is-mobile';

import { storeToRefs } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

import i18n from '@/plugins/i18n';

type AgentStatus = 'online' | 'offline' | (string & {});

interface AgentApi {
  status: AgentStatus;
  first_name: string;
  last_name: string;
  email: string;
  photo_url: string | null;
  language: string;
}

interface AgentOption {
  label: string;
  value: string;
  status: AgentStatus;
}

interface QueueOption {
  label: string;
  value: string;
  sector_uuid: string;
  queue_name: string;
}

interface Props {
  size?: 'sm' | 'md';
  bulkTransfer?: boolean;
  modelValue: QueueOption[];
  fixed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  bulkTransfer: false,
  fixed: false,
});

const emit = defineEmits<{
  'update:model-value': [value: QueueOption[]];
  'update:selectedAgent': [value: AgentOption[]];
  'transfer-complete': [status: 'success' | 'error'];
}>();

defineOptions({ name: 'RoomsTransferFields' });

const BULK_TRANSFER_BATCH_SIZE = 200;

const STATUS_PRIORITY: Record<string, number> = {
  online: 0,
  offline: 2,
};

const roomsStore = useRooms();
const profileStore = useProfile();
const {
  contactToTransfer,
  rooms,
  activeRoom,
  activeTab,
  selectedOngoingRooms,
  selectedWaitingRooms,
  activeRoomTags,
} = storeToRefs(roomsStore);
const { me } = storeToRefs(profileStore);

const isMobileDevice = ref(isMobile());

const queues = ref<QueueOption[]>([]);
const agents = ref<AgentOption[]>([]);
const selectedAgent = ref<AgentOption | null>(null);

const searchQueue = ref('');
const searchAgent = ref('');

const showTransferDisclaimer = ref(false);

const currentSelectedRooms = computed(() =>
  activeTab.value === 'ongoing'
    ? selectedOngoingRooms.value
    : selectedWaitingRooms.value,
);

const roomsToTransfer = computed(() => {
  if (props.bulkTransfer) {
    return rooms.value.filter((room: { uuid: string }) =>
      currentSelectedRooms.value.includes(room.uuid),
    );
  }

  return rooms.value.filter(
    (room: { uuid: string }) => room.uuid === contactToTransfer.value,
  );
});

const showTransferToOtherSectorDisclaimer = computed(() => {
  const queueOption = props.modelValue?.[0];
  if (!queueOption?.value) return false;

  return roomsToTransfer.value.some(
    (room: { queue?: { sector?: string } }) =>
      room.queue?.sector !== queueOption?.sector_uuid,
  );
});

const selectedQueueOption = computed<QueueOption | null>({
  get() {
    return props.modelValue?.[0] || null;
  },
  set(option) {
    emit('update:model-value', option ? [option] : []);

    if (option?.value) {
      getAgents(option.value);
    }
  },
});

const isAgentsFieldDisabled = computed(() => {
  const queueValue = props.modelValue?.[0]?.value;
  return !queueValue || agents.value?.length === 0;
});

const isSelectedAgentOffline = computed(
  () =>
    !!selectedAgent.value?.value && selectedAgent.value?.status === 'offline',
);

const haveSelectedQueue = computed(() => !!props.modelValue?.[0]?.value);

const isAgentsListEmpty = computed(
  () => haveSelectedQueue.value && agents.value?.length === 0,
);

const transferDisclaimerText = computed(() => {
  if (isSelectedAgentOffline.value) {
    return i18n.global.t('bulk_transfer.disclaimer.selected_agent_offline');
  }

  if (isAgentsListEmpty.value) {
    return i18n.global.t('bulk_transfer.disclaimer.without_online_agents');
  }
  return '';
});

const sortedAgents = computed<AgentOption[]>(() => {
  return [...agents.value].sort((a, b) => {
    const priorityA = getStatusPriority(a.status);
    const priorityB = getStatusPriority(b.status);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.label.localeCompare(b.label);
  });
});

function getStatusPriority(status: AgentStatus): number {
  if (status in STATUS_PRIORITY) return STATUS_PRIORITY[status];
  return 1;
}

function getAgentStatusLabel(status: AgentStatus): string {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getAgentStatusScheme(status: AgentStatus): string {
  if (status === 'online') return 'aux-green';
  if (status === 'offline') return 'aux-gray';
  return 'aux-orange';
}

watch(selectedAgent, (newSelectedAgent) => {
  emit('update:selectedAgent', newSelectedAgent ? [newSelectedAgent] : []);

  showTransferDisclaimer.value = newSelectedAgent?.status === 'offline';
});

watch(
  () => props.modelValue,
  (newValue) => {
    const queueUuid = newValue?.[0]?.value;
    if (queueUuid) {
      getAgents(queueUuid);
    }
  },
);

onMounted(() => {
  queues.value = [];
  agents.value = [];
  getQueues();
});

async function getQueues() {
  const newQueues = await Queue.listByProject();

  queues.value = newQueues.results.map(
    ({
      name,
      sector_name,
      uuid,
      sector_uuid,
    }: {
      name: string;
      sector_name: string;
      uuid: string;
      sector_uuid: string;
    }) => ({
      sector_uuid,
      queue_name: name,
      label: `${name} | ${i18n.global.t('sector.title')} ${sector_name}`,
      value: uuid,
    }),
  );
}

async function getAgents(queueUuid: string) {
  showTransferDisclaimer.value = false;

  const newAgents: AgentApi[] = await Queue.agentsToTransfer(queueUuid);

  const treatedAgents = newAgents
    .filter((agent) => agent.email !== me.value?.email)
    .map<AgentOption>(({ first_name, last_name, email, status }) => ({
      label: [first_name, last_name].join(' ').trim() || email,
      value: email,
      status,
    }));

  if (treatedAgents.length === 0) {
    showTransferDisclaimer.value = true;
  }

  agents.value = treatedAgents;
}

async function transfer() {
  const selectedQueue = props.modelValue?.[0]?.value;
  const intendedAgent = selectedAgent.value?.value;

  const roomUuids = roomsToTransfer.value.map(
    (room: { uuid: string }) => room.uuid,
  );

  if (!props.bulkTransfer) {
    return transferSingle(roomUuids, selectedQueue, intendedAgent);
  }

  return transferBulk(roomUuids, selectedQueue, intendedAgent);
}

async function transferSingle(
  roomUuids: string[],
  selectedQueue: string | undefined,
  intendedAgent: string | undefined,
) {
  try {
    const response = await Room.bulkTranfer({
      rooms: roomUuids,
      intended_queue: selectedQueue,
      intended_agent: intendedAgent,
    });

    if (response.status === 200) {
      callSingleSuccessAlert();
      resetRoomsToTransfer();
      if (activeRoom.value) {
        const { results } = await Room.getRoomTags(activeRoom.value.uuid, {
          next: null,
          limit: 20,
        });
        activeRoomTags.value = results;
      }
      emit('transfer-complete', 'success');
    } else {
      showAlert(i18n.global.t('contact_transferred_error'), 'error');
      emit('transfer-complete', 'error');
    }
  } catch (error) {
    console.error('An error occurred while performing the transfer:', error);
    showAlert(i18n.global.t('contact_transferred_error'), 'error');
    emit('transfer-complete', 'error');
  }
}

async function transferBulk(
  roomUuids: string[],
  selectedQueue: string | undefined,
  intendedAgent: string | undefined,
) {
  const chunks: string[][] = [];
  for (let i = 0; i < roomUuids.length; i += BULK_TRANSFER_BATCH_SIZE) {
    chunks.push(roomUuids.slice(i, i + BULK_TRANSFER_BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const chunk of chunks) {
    const response = await Room.bulkTranfer({
      rooms: chunk,
      intended_queue: selectedQueue,
      intended_agent: intendedAgent,
    });
    const { data } = response;
    totalSuccess += data?.success_count || 0;
    totalFailed += data?.failed_count || 0;
  }

  if (totalFailed === 0 && totalSuccess > 0) {
    showAlert(
      i18n.global.t('bulk_transfer.success_message', {
        count: totalSuccess,
      }),
      'success',
    );
    resetRoomsToTransfer();
    emit('transfer-complete', 'success');
  } else if (totalFailed > 0 && totalSuccess > 0) {
    showAlert(
      i18n.global.t('bulk_transfer.partial_success_message', {
        success: totalSuccess,
        failed: totalFailed,
      }),
      'attention',
    );
    resetRoomsToTransfer();
    emit('transfer-complete', 'success');
  } else {
    showAlert(i18n.global.t('bulk_transfer.error_message'), 'error');
    emit('transfer-complete', 'error');
  }
}

function resetRoomsToTransfer() {
  roomsStore.setSelectedOngoingRooms([]);
  roomsStore.setSelectedWaitingRooms([]);
  roomsStore.setContactToTransfer('');
}

function callSingleSuccessAlert() {
  const selectedAgentLabel = selectedAgent.value?.label;
  const selectedQueueUuid = props.modelValue?.[0]?.value;
  const selectedQueueName = queues.value.find(
    (queue) => queue.value === selectedQueueUuid,
  )?.queue_name;

  const destination = selectedAgentLabel || selectedQueueName;
  const toDestination = selectedAgentLabel ? 'agent' : 'queue';

  showAlert(
    i18n.global.t(`contact_transferred_to_${toDestination}`, {
      [toDestination]: destination,
    }),
    'success',
  );
}

function showAlert(text: string, type: 'success' | 'error' | 'attention') {
  if (!isMobileDevice.value) {
    callUnnnicAlert({
      props: { text, type },
      seconds: 5,
    });
  }
}

defineExpose({
  transfer,
  showAlert,
  agents,
  sortedAgents,
  selectedAgent,
  queues,
  currentSelectedRooms,
  isMobile: isMobileDevice,
  getAgentStatusLabel,
  getAgentStatusScheme,
});
</script>

<style lang="scss" scoped>
.rooms-transfer {
  &__select-destination {
    display: grid;
    gap: $unnnic-space-4;

    &.small {
      gap: $unnnic-space-1;
    }

    .select-destination {
      &__field {
        text-align: left;

        .field__label {
          margin: 0 0 $unnnic-space-2;
        }
      }

      &__disclaimer {
        margin-top: -$unnnic-space-1;

        &--small {
          margin-top: $unnnic-space-2;
        }
      }

      &__agent-label {
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  :deep(.unnnic-select__trigger-content) {
    justify-content: space-between;
  }
}
</style>
