import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { storeToRefs } from 'pinia';

import { useAssistedSalesFeatureFlag } from '@/composables/useAssistedSalesFeatureFlag';
import Copilot, {
  extractSectorUuid,
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

  const connection = computed<CopilotConnection | undefined>(() => {
    if (!connections.value.length) {
      return undefined;
    }

    if (!isPrincipal.value) {
      return connections.value[0]?.conection;
    }

    const sectorUuid = toValue(room)?.queue?.sector;
    if (!sectorUuid) {
      return undefined;
    }

    const matchedItem = connections.value.find(
      (item) => extractSectorUuid(item) === sectorUuid,
    );

    return matchedItem?.conection;
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
    isConfigured,
    isLoading,
    isPrincipal,
    reload,
  };
}
