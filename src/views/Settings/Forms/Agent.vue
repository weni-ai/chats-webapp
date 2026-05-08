<template>
  <section class="form-agent">
    <UnnnicSelect
      v-model="agentSelection"
      :options="agentsNames"
      :label="$t('agents.add.select.label')"
      :placeholder="$t('agents.add.select.placeholder')"
      returnObject
      clearable
      enableSearch
      :search="searchAgent"
      @update:search="searchAgent = $event"
    />
    <section
      v-if="selectedAgents?.length > 0"
      ref="selectedAgentsContainer"
      class="form-agent__selected-agents"
    >
      <TagGroup
        :tags="selectedAgentsTags"
        disabledTag
        hasCloseIcon
        @close="(agent) => remove(agent.uuid)"
      />
    </section>
  </section>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useInfiniteScroll } from '@vueuse/core';

import TagGroup from '@/components/TagGroup.vue';

interface Agent {
  uuid: string;
  role: number;
  project: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface SelectedAgent extends Agent {
  queue: string;
}

interface Props {
  canLoadMore: boolean;
  agents: Agent[];
  modelValue: SelectedAgent[];
}

defineOptions({
  name: 'FormAgent',
});

const props = withDefaults(defineProps<Props>(), {
  canLoadMore: false,
  agents: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: SelectedAgent[]];
  validate: [value: boolean];
  remove: [agentUuid: string];
  select: [agent: Agent];
  loadMore: [];
}>();

const selectedAgentsContainer = useTemplateRef('selectedAgentsContainer');

useInfiniteScroll(
  selectedAgentsContainer,
  () => {
    emit('loadMore');
  },
  { distance: 10, canLoadMore: () => props.canLoadMore },
);

const agentSelection = ref<Agent | null>(null);
const searchAgent = ref('');

const selectedAgents = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const agentsNames = computed(() => {
  return props.agents.map((agent) => {
    const { uuid, user } = agent;
    return {
      uuid,
      value: user.email,
      label:
        user.first_name || user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.email,
    };
  });
});

const selectedAgentsTags = computed(() => {
  return selectedAgents.value?.map((agent) => {
    const {
      user: { first_name, last_name, email },
    } = agent;
    const agentName = `${first_name} ${last_name}`.trim();
    const formattedName = agentName ? `${agentName} (${email})` : email;
    return { uuid: agent.uuid, name: formattedName };
  });
});

const validForm = computed(() => {
  return selectedAgents.value?.length > 0;
});

const remove = (agentUuid: string) => {
  emit('remove', agentUuid);
};

watch([() => selectedAgents.value, () => validForm.value], () => {
  emit('validate', validForm.value);
});

watch(agentSelection, (newVal) => {
  if (!newVal) {
    return;
  }
  const agent = props.agents.find((agent) => agent.uuid === newVal.uuid);
  if (!agent) {
    return;
  }
  emit('select', agent);
  nextTick(() => {
    agentSelection.value = null;
  });
});
</script>

<style lang="scss" scoped>
.form-agent {
  &__selected-agents {
    max-height: 60vh;
    overflow-y: auto;
  }
}
</style>
