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

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useProfile } from '@/store/modules/profile';

const props = defineProps({
  modelValue: {
    type: String,
    required: false,
    default: '',
  },
  isDisabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const profileStore = useProfile();
const { me } = storeToRefs(profileStore);

const isLoading = ref(false);
const queueSelection = ref(null);
const searchQueue = ref('');

const queues = computed(() =>
  (me.value?.queues || [])
    .filter((permission) => permission?.queue)
    .map((permission) => ({
      value: permission.queue,
      label: permission.queue_name,
    })),
);

function syncSelectionFromModelValue(uuid) {
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
