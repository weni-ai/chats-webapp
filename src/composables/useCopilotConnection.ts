import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { storeToRefs } from 'pinia';

import { useAssistedSalesFeatureFlag } from '@/composables/useAssistedSalesFeatureFlag';
import Copilot, {
  extractOriginalProjectUuid,
  extractSectorUuid,
  type CopilotConnection,
  type CopilotConnectionItem,
} from '@/services/api/resources/chats/copilot';
import { listSecondarySectorOrigins } from '@/services/api/resources/chats/copilotOrigin';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export type CopilotRoom = {
  uuid?: string;
  queue?: {
    sector?: string;
  };
};

const connections = ref<CopilotConnectionItem[]>([]);
const sectorOriginProjects = ref<Record<string, string>>({});
const isLoadingConnections = ref(false);
const isLoadingOrigins = ref(false);
let fetchPromise: Promise<void> | null = null;
let originFetchPromise: Promise<void> | null = null;
let cachedIsPrincipal: boolean | null = null;
let cachedProjectUuid: string | null = null;
let cachedOriginOrgUuid: string | null = null;

export function resetCopilotConnectionState() {
  connections.value = [];
  sectorOriginProjects.value = {};
  isLoadingConnections.value = false;
  isLoadingOrigins.value = false;
  fetchPromise = null;
  originFetchPromise = null;
  cachedIsPrincipal = null;
  cachedProjectUuid = null;
  cachedOriginOrgUuid = null;
}

export function useCopilotConnection(
  room?: MaybeRefOrGetter<CopilotRoom | null | undefined>,
) {
  const { isPrimaryProject, project } = storeToRefs(useConfig());
  const { featureFlags, featureFlagsLoaded } = storeToRefs(useFeatureFlag());
  const isPrincipal = computed(() => !!isPrimaryProject.value);
  const isAssistedSalesEnabled = computed(() =>
    useAssistedSalesFeatureFlag(featureFlags.value),
  );

  const canLoadConnections = computed(
    () =>
      featureFlagsLoaded.value &&
      isAssistedSalesEnabled.value &&
      !!project.value?.uuid,
  );

  async function loadConnections(force = false) {
    const nextIsPrincipal = isPrincipal.value;
    const nextProjectUuid = project.value?.uuid || null;

    if (!nextProjectUuid) return;

    if (
      !force &&
      fetchPromise !== null &&
      cachedIsPrincipal === nextIsPrincipal &&
      cachedProjectUuid === nextProjectUuid
    ) {
      return fetchPromise;
    }

    isLoadingConnections.value = true;
    cachedIsPrincipal = nextIsPrincipal;
    cachedProjectUuid = nextProjectUuid;

    fetchPromise = (async () => {
      try {
        connections.value = await Copilot.listConnections({
          isPrincipal: nextIsPrincipal,
        });
      } catch {
        connections.value = [];
      } finally {
        isLoadingConnections.value = false;
      }
    })();

    return fetchPromise;
  }

  async function loadSectorOrigins(force = false) {
    const orgUuid =
      ((project.value as { org?: string } | undefined)?.org || '').trim() ||
      null;

    if (!isPrincipal.value || !orgUuid) {
      sectorOriginProjects.value = {};
      cachedOriginOrgUuid = null;
      return;
    }

    if (
      !force &&
      originFetchPromise !== null &&
      cachedOriginOrgUuid === orgUuid
    ) {
      return originFetchPromise;
    }

    isLoadingOrigins.value = true;
    cachedOriginOrgUuid = orgUuid;

    originFetchPromise = (async () => {
      try {
        sectorOriginProjects.value = await listSecondarySectorOrigins(orgUuid);
      } catch {
        sectorOriginProjects.value = {};
      } finally {
        isLoadingOrigins.value = false;
      }
    })();

    return originFetchPromise;
  }

  const matchedItem = computed<CopilotConnectionItem | undefined>(() => {
    if (!connections.value.length) {
      return undefined;
    }

    if (!isPrincipal.value) {
      return connections.value[0];
    }

    const sectorUuid = toValue(room)?.queue?.sector;
    if (!sectorUuid) {
      return undefined;
    }

    return connections.value.find(
      (item) => extractSectorUuid(item) === sectorUuid,
    );
  });

  const connection = computed<CopilotConnection | undefined>(
    () => matchedItem.value?.conection,
  );

  const originProjectUuid = computed(() => {
    if (!isPrincipal.value) {
      return project.value?.uuid || undefined;
    }

    return (
      extractOriginalProjectUuid(matchedItem.value) ||
      sectorOriginProjects.value[toValue(room)?.queue?.sector || '']
    );
  });

  const isConfigured = computed(() => !!connection.value);
  const isLoading = computed(
    () => isLoadingConnections.value || isLoadingOrigins.value,
  );

  function reload() {
    return Promise.all([loadConnections(true), loadSectorOrigins(true)]);
  }

  watch(
    [
      canLoadConnections,
      isPrincipal,
      () => project.value?.uuid,
      () => (project.value as { org?: string } | undefined)?.org,
    ],
    ([ready]) => {
      if (!ready) return;
      void loadConnections();
      void loadSectorOrigins();
    },
    { immediate: true },
  );

  return {
    connection,
    connections,
    originProjectUuid,
    isConfigured,
    isLoading,
    isPrincipal,
    reload,
  };
}

export function isCopilotConnectionConfigured(
  room?: CopilotRoom | null,
): boolean {
  if (!connections.value.length) {
    return false;
  }

  const { isPrimaryProject } = useConfig();
  if (!isPrimaryProject) {
    return !!connections.value[0]?.conection;
  }

  const sectorUuid = room?.queue?.sector;
  if (!sectorUuid) {
    return false;
  }

  return connections.value.some(
    (item) => extractSectorUuid(item) === sectorUuid,
  );
}
