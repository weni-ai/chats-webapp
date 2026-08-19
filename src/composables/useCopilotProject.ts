import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProject,
} from '@/services/api/resources/chats/copilotProject';

const linkedProject = ref<CopilotProject | null>(null);
const isLoading = ref(false);
let fetchPromise: Promise<void> | null = null;

export function resetCopilotProjectState() {
  linkedProject.value = null;
  isLoading.value = false;
  fetchPromise = null;
}

export function useCopilotProject() {
  const { project } = storeToRefs(useConfig());

  async function fetchLinkedProject(force = false) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      linkedProject.value = null;
      return;
    }

    if (fetchPromise !== null && !force) {
      return fetchPromise;
    }

    isLoading.value = true;
    fetchPromise = (async () => {
      try {
        linkedProject.value =
          await CopilotProjectService.getLinkedProject(projectUuid);
      } catch {
        linkedProject.value = null;
      } finally {
        isLoading.value = false;
      }
    })();

    return fetchPromise;
  }

  function setLinkedProject(projectValue: CopilotProject | null) {
    linkedProject.value = projectValue;
  }

  async function createProject(name: string) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      throw new Error('Missing project uuid');
    }

    const createdProject = await CopilotProjectService.create(
      name,
      projectUuid,
    );
    linkedProject.value = createdProject;
    return createdProject;
  }

  async function changeLinkedProject(newCopilotProjectUuid: string) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      throw new Error('Missing project uuid');
    }

    const updatedProject = await CopilotProjectService.update(
      projectUuid,
      newCopilotProjectUuid,
    );
    linkedProject.value = updatedProject;
    return updatedProject;
  }

  const isLinked = computed(() => !!linkedProject.value);
  const showNewBadge = computed(() => !linkedProject.value);

  return {
    linkedProject,
    isLoading,
    isLinked,
    showNewBadge,
    fetchLinkedProject,
    setLinkedProject,
    createProject,
    changeLinkedProject,
  };
}
