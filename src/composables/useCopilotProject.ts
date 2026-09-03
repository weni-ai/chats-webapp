import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProject,
} from '@/services/api/resources/chats/copilotProject';

const linkedProject = ref<CopilotProject | null>(null);
const isLoading = ref(false);
const canCreateProject = ref(false);
const isLoadingCanCreate = ref(false);
let fetchPromise: Promise<void> | null = null;
let canCreatePromise: Promise<void> | null = null;

export function resetCopilotProjectState() {
  linkedProject.value = null;
  isLoading.value = false;
  canCreateProject.value = false;
  isLoadingCanCreate.value = false;
  fetchPromise = null;
  canCreatePromise = null;
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

  async function disconnectLinkedProject() {
    const copilotProjectUuid = linkedProject.value?.uuid;

    if (!copilotProjectUuid) {
      throw new Error('Missing copilot project uuid');
    }

    await CopilotProjectService.remove(copilotProjectUuid);
    linkedProject.value = null;
  }

  async function fetchCanCreate(force = false) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      canCreateProject.value = false;
      return;
    }

    if (canCreatePromise !== null && !force) {
      return canCreatePromise;
    }

    isLoadingCanCreate.value = true;
    canCreatePromise = (async () => {
      try {
        canCreateProject.value =
          await CopilotProjectService.canCreate(projectUuid);
      } catch {
        canCreateProject.value = false;
      } finally {
        isLoadingCanCreate.value = false;
      }
    })();

    return canCreatePromise;
  }

  const isLinked = computed(() => !!linkedProject.value);
  const showNewBadge = computed(() => !linkedProject.value);
  const isCreateDisabled = computed(
    () => isLoadingCanCreate.value || !canCreateProject.value,
  );

  return {
    linkedProject,
    isLoading,
    canCreateProject,
    isLoadingCanCreate,
    isCreateDisabled,
    isLinked,
    showNewBadge,
    fetchLinkedProject,
    fetchCanCreate,
    setLinkedProject,
    createProject,
    changeLinkedProject,
    disconnectLinkedProject,
  };
}
