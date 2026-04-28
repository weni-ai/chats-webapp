<template>
  <UnnnicDrawer
    :modelValue="props.open"
    :title="title"
    size="gt"
    :primaryButtonText="$t('save')"
    :secondaryButtonText="$t('cancel')"
    :disabledPrimaryButton="!hasChanges || !validLimitForm"
    :loadingPrimaryButton="isLoadingSave"
    :disabledSecondaryButton="isLoadingSave"
    @primary-button-click="saveChanges"
    @secondary-button-click="emit('update:open', false)"
    @update:model-value="emit('update:open', $event)"
    @close="emit('update:open', false)"
  >
    <template #content>
      <section
        v-if="isLoadingQueuesPermissions"
        class="queue-manager__loading"
      >
        <UnnnicIconLoading />
      </section>
      <section
        v-else
        class="queue-manager__body"
      >
        <section
          v-if="isBulk"
          class="queue-manager__bulk"
        >
          <UnnnicDisclaimer :description="bulkDisclaimerDescription" />
          <section class="queue-manager__bulk-toolbar">
            <section class="queue-manager__bulk-stack">
              <p class="queue-manager__bulk-hint">
                {{
                  $t(
                    'config_chats.representatives.queue_manager.bulk_select_action_description',
                  )
                }}
              </p>
              <section class="queue-manager__bulk-radios">
                <UnnnicRadio
                  :modelValue="bulkSelectAction"
                  value="add"
                  @update:model-value="bulkSelectAction = $event"
                >
                  {{
                    $t(
                      'config_chats.representatives.queue_manager.bulk_add_action',
                    )
                  }}
                </UnnnicRadio>
                <UnnnicRadio
                  :modelValue="bulkSelectAction"
                  value="remove"
                  @update:model-value="bulkSelectAction = $event"
                >
                  {{
                    $t(
                      'config_chats.representatives.queue_manager.bulk_remove_action',
                    )
                  }}
                </UnnnicRadio>
              </section>
            </section>
          </section>
        </section>
        <section
          v-else
          class="queue-manager__chats-limit"
        >
          <SettingsProjectOptionsItem
            v-model="formData.chatsLimit.is_active"
            :name="
              $t(
                'config_chats.representatives.queue_manager.chats_limit.switch_label',
              )
            "
            :hint="
              $t(
                'config_chats.representatives.queue_manager.chats_limit.switch_helper',
              )
            "
            @update:model-value="hasChanges = true"
          />
          <UnnnicInput
            v-if="formData.chatsLimit.is_active"
            v-model="formData.chatsLimit.total"
            :label="
              $t(
                'config_chats.representatives.queue_manager.chats_limit.input_label',
              )
            "
            :placeholder="
              $t(
                'config_chats.representatives.queue_manager.chats_limit.input_placeholder',
              )
            "
            :message="
              $t(
                'config_chats.representatives.queue_manager.chats_limit.input_helper',
              )
            "
            @update:model-value="hasChanges = true"
          />
        </section>
        <section class="queue-manager__queues">
          <SectorQueuesCheckbox
            :selectedQueues="currentSelectedQueues"
            :sectors="sectorQueueData"
            :isBulk="isBulk"
            @update:selected-queues="handleSelectedQueues($event)"
          />
        </section>
      </section>
    </template>
  </UnnnicDrawer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import SettingsProjectOptionsItem from '../../SettingsProjectOptions/SettingsProjectOptionsItem.vue';
import SectorQueuesCheckbox from './SectorQueuesCheckbox.vue';

import RepresentativeService from '@/services/api/resources/settings/representative';

import { UnnnicCallAlert, UnnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

import { handleConnectOverlay } from '@/utils/overlay';

import type { Representative, RepresentativeQueuePermission } from '../types';

defineOptions({
  name: 'SettingsRepresentativesQueueManager',
});

interface BodyFormData {
  representatives: string[];
  toRemove: string[];
  toAdd: string[];
  chatsLimit: { is_active: boolean; total: number | null } | undefined;
}

interface Props {
  open: boolean;
  representatives: Representative[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [void];
}>();

const formData = ref({
  agents: [],
  toRemove: [],
  toAdd: [],
  chatsLimit: { is_active: false, total: null },
});

const sectorQueueData = ref<RepresentativeQueuePermission[]>([]);
const currentSelectedQueues = ref([]);
const hasChanges = ref(false);
const isLoadingSave = ref(false);
const isLoadingQueuesPermissions = ref(false);

const bulkSelectAction = ref<'add' | 'remove' | null>(null);

const validLimitForm = computed(() => {
  if (isBulk.value) {
    return !!bulkSelectAction.value && currentSelectedQueues.value.length;
  }

  if (!formData.value.chatsLimit.is_active) {
    return true;
  }
  return !!formData.value.chatsLimit.total;
});

const isBulk = computed(() => {
  return props.representatives.length > 1;
});

const title = computed(() => {
  return isBulk.value
    ? i18n.global.t('config_chats.representatives.queue_manager.bulk_title')
    : i18n.global.t('config_chats.representatives.queue_manager.title', {
        representativeName: props.representatives[0].name,
      });
});

const bulkDisclaimerDescription = computed(() => {
  return i18n.global.t(
    'config_chats.representatives.queue_manager.bulk_disclaimer_description',
    {
      count: props.representatives.length,
    },
  );
});

const getQueuesPermissions = async () => {
  try {
    isLoadingQueuesPermissions.value = true;
    const { queue_permissions } =
      await RepresentativeService.listRepresentativeQueuePermission({
        representativeEmail: props.representatives[0].email,
      });

    sectorQueueData.value = queue_permissions.map(({ sector }) => sector);
  } catch (error) {
    console.error('Error getting queues permissions', error);
  } finally {
    isLoadingQueuesPermissions.value = false;
  }
};

const handleSelectedQueues = ({
  currentQueues,
  queuesToAdd,
  queuesToRemove,
}: {
  currentQueues: string[];
  queuesToAdd: string[];
  queuesToRemove: string[];
}) => {
  hasChanges.value = true;
  currentSelectedQueues.value = currentQueues;
  if (queuesToRemove.length > 0) {
    const newToRemove = [...formData.value.toRemove, ...queuesToRemove];
    formData.value.toRemove = [...new Set(newToRemove)];
    formData.value.toAdd = formData.value.toAdd.filter(
      (queueUuid) => !queuesToRemove.includes(queueUuid),
    );
  }
  if (queuesToAdd.length > 0) {
    const newToAdd = [...formData.value.toAdd, ...queuesToAdd];
    formData.value.toAdd = [...new Set(newToAdd)];
    formData.value.toRemove = formData.value.toRemove.filter(
      (queueUuid) => !queuesToAdd.includes(queueUuid),
    );
  }
};

const makeSingleRepresentativeFormData = () => {
  const { agents, toRemove, toAdd, chatsLimit } = formData.value;

  const alreadyInQueue = sectorQueueData.value.flatMap((sector) => {
    const filteredQueues = sector.queues.filter(
      (queue) => queue.agent_in_queue,
    );
    return filteredQueues.map((queue) => queue.uuid);
  });

  const filteredToAdd = toAdd.filter(
    (queueUuid) => !alreadyInQueue.includes(queueUuid),
  );

  const alreadyNotInQueue = sectorQueueData.value.flatMap((sector) => {
    const filteredQueues = sector.queues.filter(
      (queue) => !queue.agent_in_queue,
    );
    return filteredQueues.map((queue) => queue.uuid);
  });

  const filteredToRemove = toRemove.filter(
    (queueUuid) => !alreadyNotInQueue.includes(queueUuid),
  );
  return {
    representatives: agents,
    toRemove: filteredToRemove,
    toAdd: filteredToAdd,
    chatsLimit,
  };
};

const makeBulkFormData = () => {
  return {
    representatives: props.representatives.map(
      (representative) => representative.email,
    ),
    toRemove:
      bulkSelectAction.value === 'remove' ? currentSelectedQueues.value : [],
    toAdd: bulkSelectAction.value === 'add' ? currentSelectedQueues.value : [],
    chatsLimit: undefined,
  };
};

const saveChanges = async () => {
  try {
    isLoadingSave.value = true;

    let bodyData: BodyFormData = {
      representatives: [],
      toRemove: [],
      toAdd: [],
      chatsLimit: undefined,
    };

    if (isBulk.value) {
      bodyData = makeBulkFormData();
    } else {
      bodyData = makeSingleRepresentativeFormData();
    }

    await RepresentativeService.updateRepresentativeQueuePermission(bodyData);

    UnnnicCallAlert({
      props: {
        text: i18n.global.t('config_chats.representatives.save_success'),
        type: 'success',
      },
    });
    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error('Error saving changes', error);
    UnnnicToastManager.error(
      i18n.global.t('config_chats.representatives.save_error'),
      '',
      {
        button: {
          text: i18n.global.t('try_again'),
          action: () => saveChanges(),
        },
      },
    );
  } finally {
    isLoadingSave.value = false;
  }
};

onMounted(async () => {
  await getQueuesPermissions();

  formData.value.agents = props.representatives.map(
    (representative) => representative.email,
  );

  if (!isBulk.value) {
    const hasEnabledChatsLimit = props.representatives[0].chats_limit.active;

    if (hasEnabledChatsLimit) {
      formData.value.chatsLimit = {
        is_active: true,
        total: String(props.representatives[0].chats_limit.total),
      };
    }

    currentSelectedQueues.value = sectorQueueData.value.flatMap((sector) => {
      const filteredQueues = sector.queues.filter(
        (queue) => queue.agent_in_queue,
      );
      return filteredQueues.map((queue) => queue.uuid);
    });
  }

  handleConnectOverlay(true);
});

onUnmounted(() => handleConnectOverlay(false));

watch(
  () => formData.value.chatsLimit.is_active,
  (value) => {
    if (!value) {
      formData.value.chatsLimit.total = null;
    }
  },
);
</script>

<style lang="scss" scoped>
.queue-manager {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    margin-bottom: $unnnic-space-6;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__bulk {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
  }

  &__bulk-toolbar {
    display: flex;
    gap: $unnnic-space-6;
  }

  &__bulk-stack {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }

  &__bulk-hint {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }

  &__bulk-radios {
    display: flex;
    gap: $unnnic-space-6;
  }

  &__chats-limit {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }
}
</style>
