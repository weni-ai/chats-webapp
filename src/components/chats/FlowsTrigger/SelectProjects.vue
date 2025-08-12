<template>
  <section
    class="select-projects"
    data-testid="select-projects-container"
  >
    <UnnnicLabel
      :label="$t('flows_trigger.select_project')"
      data-testid="select-projects-label"
    />
    <UnnnicSelectSmart
      v-model="projectUuid"
      :options="projects"
      :loading="isLoading"
      autocomplete
      autocompleteIconLeft
      autocompleteClearOnFocus
      data-testid="select-projects-input"
      @update:model-value="getProjects(projectUuid?.[0].value)"
    />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Group from '@/services/api/resources/settings/group.js';
import { useConfig } from '@/store/modules/config';

const configStore = useConfig();

const projects = ref([]);
const isLoading = ref(false);

const projectUuid = ref([]);

const getAllProjects = async () => {
  isLoading.value = true;
  const allProjects = [];
  let offset = 0;
  const limit = 5;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await Group.listProjects({
        orgUuid: configStore.project?.org,
        limit,
        offset,
        params: {
          its_principal: false,
        },
      });
      console.log('allProjects get', response);
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
  }
};

const getProjects = async (selectedProjectUuid) => {
  if (selectedProjectUuid) {
    console.log('Selected project:', selectedProjectUuid);
  }
};

onMounted(() => {
  getAllProjects();
});
</script>
