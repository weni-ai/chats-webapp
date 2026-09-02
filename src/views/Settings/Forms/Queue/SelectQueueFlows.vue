<template>
  <section
    class="select-queue-flows"
    data-testid="select-queue-flows"
  >
    <section
      class="select-queue-flows__label"
      data-testid="select-queue-flows-label"
    >
      {{ $t('config_chats.queues.bond_flows_queue.select.label') }}
      <UnnnicToolTip
        enabled
        side="right"
        maxWidth="23rem"
        :text="$t('config_chats.queues.bond_flows_queue.select.tooltip')"
      >
        <UnnnicIcon
          icon="ri:question-line"
          scheme="fg-base"
          size="sm"
        />
      </UnnnicToolTip>
    </section>
    <UnnnicSelect
      v-model="flowSelection"
      data-testid="select-queue-flows-input"
      :options="availableFlowOptions"
      :disabled="loadingFlows"
      :placeholder="
        $t('config_chats.queues.bond_flows_queue.select.placeholder')
      "
      clearable
      enableSearch
      :search="searchFlow"
      @update:search="searchFlow = $event"
    />
    <section
      v-if="selectedFlows.length > 0 && !loadingFlows"
      class="select-queue-flows__chips"
      data-testid="select-queue-flows-chips"
    >
      <TagGroup
        :tags="selectedFlowTags"
        disabledTag
        hasCloseIcon
        @close="(flow) => removeFlow(flow.uuid)"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import TagGroup from '@/components/TagGroup.vue';

defineOptions({ name: 'SelectQueueFlows' });

interface QueueFlow {
  uuid: string;
  name: string;
}

interface QueueFlowSelectOption {
  value: string;
  label: string;
}

interface QueueFlowTag {
  uuid: string;
  name: string;
}

interface SelectQueueFlowsProps {
  modelValue?: string[];
  projectToListFlows: string;
}

const props = withDefaults(defineProps<SelectQueueFlowsProps>(), {
  modelValue: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const flowSelection = ref('');
const flows = ref<QueueFlow[]>([]);
const searchFlow = ref('');
const loadingFlows = ref(false);

const selectedFlows = computed({
  get: () => props.modelValue,
  set: (value: string[]) => {
    emit('update:modelValue', value);
  },
});

const availableFlowOptions = computed<QueueFlowSelectOption[]>(() => {
  const selectedUuids = new Set(selectedFlows.value);

  return flows.value
    .filter((flow) => !selectedUuids.has(flow.uuid))
    .map(({ uuid, name }) => ({
      value: uuid,
      label: name,
    }));
});

const selectedFlowTags = computed<QueueFlowTag[]>(() => {
  const flowsByUuid = new Map(
    flows.value.map((flow) => [flow.uuid, flow.name]),
  );

  return selectedFlows.value.map((uuid) => ({
    uuid,
    name: flowsByUuid.get(uuid) || uuid,
  }));
});

watch(flowSelection, (uuid) => {
  if (!uuid) {
    return;
  }

  const alreadySelected = selectedFlows.value.includes(uuid);
  const flowExists = flows.value.some((item) => item.uuid === uuid);

  if (!alreadySelected && flowExists) {
    selectedFlows.value = [...selectedFlows.value, uuid];
  }

  nextTick(() => {
    flowSelection.value = '';
    searchFlow.value = '';
  });
});

function removeFlow(flowUuid: string) {
  selectedFlows.value = selectedFlows.value.filter((uuid) => uuid !== flowUuid);
}

async function getFlows() {
  loadingFlows.value = true;

  try {
    const response: QueueFlow[] = await FlowsTrigger.getFlows(
      props.projectToListFlows,
      {
        verify_chats_tag: true,
      },
    );

    flows.value = response.map(({ uuid, name }) => ({ uuid, name }));
  } catch (error) {
    flows.value = [];
    console.error('Error getting flows', error);
  } finally {
    loadingFlows.value = false;
  }
}

watch(
  () => props.projectToListFlows,
  (value) => {
    if (value) {
      getFlows();
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.select-queue-flows {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__label {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    margin-bottom: $unnnic-space-1;

    color: $unnnic-color-fg-base;
    font: $unnnic-font-body;

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }

  &__chips {
    width: 100%;
  }
}
</style>
