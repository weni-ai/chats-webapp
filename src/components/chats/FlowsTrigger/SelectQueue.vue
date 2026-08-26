<template>
  <section
    class="select-queue"
    data-testid="select-queue-container"
  >
    <UnnnicSelect
      v-model="queueSelection"
      data-testid="select-queue-input"
      :options="queues"
      :disabled="isDisabled || isLoading"
      :label="$t('select_queue')"
      :placeholder="$t('search_or_select')"
      returnObject
      clearable
      enableSearch
      :search="searchQueue"
      @update:search="searchQueue = $event"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useProfile } from '@/store/modules/profile';

import type {
  QueuePermission,
  QueueSelectOption,
  SelectQueueProps,
} from './types';

const props = withDefaults(defineProps<SelectQueueProps>(), {
  modelValue: '',
  isDisabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [uuid: string];
}>();

const profileStore = useProfile();
const { me } = storeToRefs(profileStore);

const isLoading = ref(false);
const queueSelection = ref<QueueSelectOption | null>(null);
const searchQueue = ref('');

function hasQueue(
  permission: QueuePermission,
): permission is QueuePermission & { queue: string; queue_name: string } {
  return Boolean(permission?.queue);
}

const queues = computed<QueueSelectOption[]>(() =>
  ((me.value?.queues as QueuePermission[] | undefined) || [])
    .filter(hasQueue)
    .map((permission) => ({
      value: permission.queue,
      label: permission.queue_name,
    })),
);

function syncSelectionFromModelValue(uuid?: string) {
  if (!uuid) {
    queueSelection.value = null;
    return;
  }

  const option = queues.value.find((queue) => queue.value === uuid);
  if (option) {
    if (queueSelection.value?.value !== option.value) {
      queueSelection.value = option;
    }
  } else {
    queueSelection.value = null;
  }
}

watch(queueSelection, (newQueueSelection) => {
  const uuid = newQueueSelection?.value || '';
  if (uuid !== props.modelValue) {
    emit('update:modelValue', uuid);
  }
});

watch(
  () => props.modelValue,
  (uuid) => {
    syncSelectionFromModelValue(uuid);
  },
  { immediate: true },
);

watch(
  queues,
  () => {
    syncSelectionFromModelValue(props.modelValue);
  },
  { deep: true },
);

const getQueues = async () => {
  if (queues.value.length) return;

  isLoading.value = true;

  try {
    await profileStore.getMeQueues();
  } catch (error) {
    console.error('Error getting queues', error);
  } finally {
    isLoading.value = false;
    syncSelectionFromModelValue(props.modelValue);
  }
};

onMounted(() => {
  getQueues();
});
</script>
