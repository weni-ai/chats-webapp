import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProjectSummary,
} from '@/services/api/resources/chats/copilotProject';

const projects = ref<CopilotProjectSummary[]>([]);
const isLoading = ref(false);
let fetchPromise: Promise<void> | null = null;

export function resetCopilotProjectsListState() {
  projects.value = [];
  isLoading.value = false;
  fetchPromise = null;
}

export function useCopilotProjectsList() {
  const { project } = storeToRefs(useConfig());

  async function fetchProjects(force = false) {
    const orgUuid = project.value?.org;

    if (!orgUuid) {
      projects.value = [];
      return;
    }

    if (fetchPromise !== null && !force) {
      return fetchPromise;
    }

    isLoading.value = true;
    fetchPromise = (async () => {
      try {
        projects.value =
          await CopilotProjectService.listExistingProjects(orgUuid);
      } catch {
        projects.value = [];
      } finally {
        isLoading.value = false;
      }
    })();

    return fetchPromise;
  }

  const hasMultipleProjects = computed(() => projects.value.length > 1);

  return {
    projects,
    isLoading,
    hasMultipleProjects,
    fetchProjects,
  };
}
