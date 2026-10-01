import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { storeToRefs } from 'pinia';

import { useAssistedSalesFeatureFlag } from '@/composables/useAssistedSalesFeatureFlag';
import Copilot, {
  extractProjectUuid,
  extractSectorUuid,
  getMockCopilotConnection,
  type CopilotConnection,
  type CopilotConnectionItem,
} from '@/services/api/resources/chats/copilot';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export type CopilotRoom = {
  uuid?: string;
  queue?: {
    sector?: string;
  };
};

const connections = ref<CopilotConnectionItem[]>([]);
const isLoading = ref(false);
let fetchPromise: Promise<void> | null = null;
let cachedIsPrincipal: boolean | null = null;
let cachedProjectUuid: string | null = null;

export function resetCopilotConnectionState() {
  connections.value = [];
  isLoading.value = false;
  fetchPromise = null;
  cachedIsPrincipal = null;
  cachedProjectUuid = null;
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

    isLoading.value = true;
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
        isLoading.value = false;
      }
    })();

    return fetchPromise;
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

  const connection = computed<CopilotConnection | undefined>(() => {
    const mockConnection = getMockCopilotConnection();
    if (mockConnection) {
      return mockConnection;
    }

    return matchedItem.value?.conection;
  });

  const originProjectUuid = computed(() => {
    if (isPrincipal.value) {
      return extractProjectUuid(matchedItem.value);
    }

    return project.value?.uuid || undefined;
  });

  const isConfigured = computed(() => !!connection.value);

  function reload() {
    return loadConnections(true);
  }

  watch(
    [canLoadConnections, isPrincipal, () => project.value?.uuid],
    ([ready]) => {
      if (!ready) return;
      loadConnections();
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
