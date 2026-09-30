import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProject,
} from '@/services/api/resources/chats/copilotProject';

const linkedProject = ref<CopilotProject | null>(null);
const isLoading = ref(true);
const canCreateProject = ref(false);
const isLoadingCanCreate = ref(true);
let fetchPromise: Promise<void> | null = null;
let canCreatePromise: Promise<void> | null = null;

export function resetCopilotProjectState() {
  linkedProject.value = null;
  isLoading.value = true;
  canCreateProject.value = false;
  isLoadingCanCreate.value = true;
  fetchPromise = null;
  canCreatePromise = null;
}

export function useCopilotProject() {
  const { project } = storeToRefs(useConfig());

  async function fetchLinkedProject(force = false) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      linkedProject.value = null;
      isLoading.value = false;
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

  async function reconnectLinkedProject() {
    const current = linkedProject.value;

    if (!current?.uuid) {
      throw new Error('Missing copilot project uuid');
    }

    const updatedProject = await CopilotProjectService.reconnect(current.uuid);
    linkedProject.value = {
      ...current,
      ...updatedProject,
      projectUuid: updatedProject.projectUuid || current.projectUuid,
      isConnected: true,
    };
    return linkedProject.value;
  }

  async function disconnectLinkedProject() {
    const current = linkedProject.value;

    if (!current?.uuid) {
      throw new Error('Missing copilot project uuid');
    }

    await CopilotProjectService.remove(current.uuid);

    const projectUuid = project.value?.uuid;
    const disconnectedFallback: CopilotProject = {
      ...current,
      isConnected: false,
      disconnectedOn: current.disconnectedOn || new Date().toISOString(),
    };

    if (!projectUuid) {
      linkedProject.value = disconnectedFallback;
      return;
    }

    try {
      const refreshed =
        await CopilotProjectService.getLinkedProject(projectUuid);
      linkedProject.value = refreshed ?? disconnectedFallback;
    } catch {
      linkedProject.value = disconnectedFallback;
    }
  }

  async function fetchCanCreate(force = false) {
    const projectUuid = project.value?.uuid;

    if (!projectUuid) {
      canCreateProject.value = false;
      isLoadingCanCreate.value = false;
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
  const isConnected = computed(() => !!linkedProject.value?.isConnected);
  const showNewBadge = computed(() => !isConnected.value);
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
    isConnected,
    showNewBadge,
    fetchLinkedProject,
    fetchCanCreate,
    setLinkedProject,
    createProject,
    reconnectLinkedProject,
    disconnectLinkedProject,
  };
}
