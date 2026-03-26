<template>
  <section
    class="select-projects"
    data-testid="select-projects-container"
  >
    <UnnnicSelect
      v-model="projectSelection"
      data-testid="select-projects-input"
      :options="projects"
      :disabled="isLoading"
      :label="$t('flows_trigger.select_project')"
      :placeholder="$t('search_or_select')"
      returnObject
      clearable
      enableSearch
      :search="searchProject"
      @update:search="searchProject = $event"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Group from '@/services/api/resources/settings/group.js';
import { useConfig } from '@/store/modules/config';
import { makeRequestWithRetry } from '@/utils/requests';

const configStore = useConfig();

const props = defineProps({
  modelValue: {
    type: String,
    required: false,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const projects = ref([]);
const isLoading = ref(false);
const projectSelection = ref(null);
const searchProject = ref('');

function syncSelectionFromModelValue(uuid) {
  if (!uuid) {
    projectSelection.value = null;
    return;
  }
  const opt = projects.value.find((p) => p.value === uuid);
  if (opt) {
    if (projectSelection.value?.value !== opt.value) {
      projectSelection.value = opt;
    }
  } else {
    projectSelection.value = null;
  }
}

watch(projectSelection, (newVal) => {
  const uuid = newVal?.value || '';
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
  projects,
  () => {
    syncSelectionFromModelValue(props.modelValue);
  },
  { deep: true },
);

const getAllProjects = async () => {
  isLoading.value = true;

  const allProjects = [];
  let offset = 0;
  const limit = 20;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await makeRequestWithRetry(() =>
        Group.listProjects({
          orgUuid: configStore.project?.org,
          limit,
          offset,
          params: {
            its_principal: false,
          },
        }),
      );

      allProjects.push(...response.results);

      hasMore = !!response.next;
      offset += limit;
    }

    projects.value = allProjects.map((project) => ({
      value: project.uuid,
      label: project.name,
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    projects.value = [];
  } finally {
    isLoading.value = false;
    syncSelectionFromModelValue(props.modelValue);
  }
};

onMounted(() => {
  getAllProjects();
});
</script>
