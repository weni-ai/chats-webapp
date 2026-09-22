import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProjectSummary,
} from '@/services/api/resources/chats/copilotProject';

const projects = ref<CopilotProjectSummary[]>([]);
const isLoading = ref(false);
let fetchPromise: Promise<void> | null = null;
let fetchGeneration = 0;

export function resetCopilotProjectsListState() {
  projects.value = [];
  isLoading.value = false;
  fetchPromise = null;
  fetchGeneration = 0;
}

function readOrgUuid(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;

  if (value && typeof value === 'object' && 'uuid' in value) {
    const uuid = (value as { uuid?: unknown }).uuid;
    return typeof uuid === 'string' && uuid ? uuid : undefined;
  }

  return undefined;
}

export function useCopilotProjectsList() {
  const { project } = storeToRefs(useConfig());
  const orgUuid = computed(() => {
    const current = project.value as
      | { org?: unknown; organization?: unknown }
      | null
      | undefined;

    return readOrgUuid(current?.org ?? current?.organization);
  });

  async function fetchProjects(force = false) {
    const currentOrgUuid = orgUuid.value;

    if (!currentOrgUuid) {
      projects.value = [];
      return;
    }

    if (fetchPromise !== null && !force) {
      return fetchPromise;
    }

    const generation = ++fetchGeneration;
    isLoading.value = true;
    fetchPromise = (async () => {
      try {
        const result =
          await CopilotProjectService.listExistingProjects(currentOrgUuid);

        if (generation !== fetchGeneration) return;

        projects.value = result;
      } catch {
        if (generation !== fetchGeneration) return;

        projects.value = [];
      } finally {
        if (generation === fetchGeneration) {
          isLoading.value = false;
        }
      }
    })();

    return fetchPromise;
  }

  watch(orgUuid, (next, previous) => {
    if (!next || next === previous) return;
    fetchProjects(true);
  });

  const hasMultipleProjects = computed(() => projects.value.length > 1);

  return {
    projects,
    isLoading,
    hasMultipleProjects,
    fetchProjects,
  };
}
