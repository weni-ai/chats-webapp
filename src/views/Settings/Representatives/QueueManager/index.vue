<template>
  <UnnnicDrawer
    :modelValue="props.open"
    :title="title"
    size="gt"
    :primaryButtonText="$t('save')"
    :secondaryButtonText="$t('cancel')"
    :disabledPrimaryButton="!hasChanges || !validLimitForm"
    :loadingPrimaryButton="isLoadingRequest"
    :disabledSecondaryButton="isLoadingRequest"
    @primary-button-click="saveChanges"
    @secondary-button-click="emit('update:open', false)"
    @update:model-value="emit('update:open', $event)"
    @close="emit('update:open', false)"
  >
    <template #content>
      <section class="settings-representatives-queue-manager__content">
        <section v-if="props.bulk">TODO: Bulk header</section>
        <section
          v-else
          class="settings-representatives-queue-manager__content__chats-limit"
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
            v-model="formData.chatsLimit.limit"
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
        <section
          class="settings-representatives-queue-manager__content__sectors-queues"
        >
          <SectorQueuesCheckbox
            :selectedQueues="currentSelectedQueues"
            :sectors="sectorQueueData"
            @update:selected-queues="handleSelectedQueues($event)"
          />
        </section>
      </section>
    </template>
  </UnnnicDrawer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import SettingsProjectOptionsItem from '../../SettingsProjectOptions/SettingsProjectOptionsItem.vue';
import SectorQueuesCheckbox from './SectorQueuesCheckbox.vue';

import RepresentativeService from '@/services/api/resources/settings/representative';

import { UnnnicCallAlert, UnnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'SettingsRepresentativesQueueManager',
});

interface Props {
  open: boolean;
  // TODO: type
  representatives: any[];
  bulk?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bulk: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [void];
}>();

const title = computed(() => {
  return props.bulk
    ? i18n.global.t('config_chats.representatives.queue_manager.bulk_title')
    : i18n.global.t('config_chats.representatives.queue_manager.title', {
        representativeName: props.representatives[0].name,
      });
});

const formData = ref({
  agents: [],
  toRemove: [],
  toAdd: [],
  chatsLimit: { is_active: false, limit: null },
});

const sectorQueueData = ref<{ name: string; queues: Record<string, any> }[]>(
  [],
);
const currentSelectedQueues = ref([]);
const hasChanges = ref(false);
const isLoadingRequest = ref(false);
const validLimitForm = computed(() => {
  if (!formData.value.chatsLimit.is_active) {
    return true;
  }
  return !!formData.value.chatsLimit.limit;
});

const getQueuesPermissions = async () => {
  const { queue_permissions } =
    await RepresentativeService.listRepresentativeQueuePermission({
      representativeEmail: props.representatives[0].email,
    });

  sectorQueueData.value = queue_permissions.map(({ sector }) => sector);
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

const saveChanges = async () => {
  try {
    isLoadingRequest.value = true;
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

    await RepresentativeService.updateRepresentativeQueuePermission({
      representatives: agents,
      toRemove: filteredToRemove,
      toAdd: filteredToAdd,
      chatsLimit,
    });
    UnnnicCallAlert({
      props: {
        text: i18n.global.t(
          'config_chats.representatives.queue_manager.save_success',
        ),
        type: 'success',
      },
    });
    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error('Error saving changes', error);
    UnnnicToastManager.error(
      i18n.global.t('config_chats.representatives.queue_manager.save_error'),
      '',
      {
        button: {
          text: i18n.global.t('try_again'),
          action: () => saveChanges(),
        },
      },
    );
  } finally {
    isLoadingRequest.value = false;
  }
};

onMounted(async () => {
  formData.value.agents = props.representatives.map(
    (representative) => representative.email,
  );

  if (props.bulk) {
    // TODO

    return;
  }

  const hasEnabledChatsLimit = props.representatives[0].chats_limit.is_active;

  if (hasEnabledChatsLimit) {
    formData.value.chatsLimit = props.representatives[0].chats_limit;
  }

  await getQueuesPermissions();

  currentSelectedQueues.value = sectorQueueData.value.flatMap((sector) => {
    const filteredQueues = sector.queues.filter(
      (queue) => queue.agent_in_queue,
    );
    return filteredQueues.map((queue) => queue.uuid);
  });
});

watch(
  () => formData.value.chatsLimit.is_active,
  (value) => {
    if (!value) {
      formData.value.chatsLimit.limit = null;
    }
  },
);
</script>

<style lang="scss" scoped>
.settings-representatives-queue-manager {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    margin-bottom: $unnnic-space-6;

    &__chats-limit {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-2;
    }
  }
}
</style>
