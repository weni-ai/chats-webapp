import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import moment from 'moment';

import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import { buildCopilotConversationsUrl } from '@/utils/copilotProject';

export type CopilotConversationRoom = {
  uuid?: string;
  created_on?: string;
  ended_at?: string;
};

const linkedProjectUuidByOrigin = new Map<string, string | null>();
const inflightByOrigin = new Map<string, Promise<string | null>>();

export function resetCopilotConversationUrlState() {
  linkedProjectUuidByOrigin.clear();
  inflightByOrigin.clear();
}

function formatDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = moment(value);
  return date.isValid() ? date.format('YYYY-MM-DD') : undefined;
}

async function resolveCopilotProjectUuid(
  originProjectUuid: string,
): Promise<string | null> {
  if (linkedProjectUuidByOrigin.has(originProjectUuid)) {
    return linkedProjectUuidByOrigin.get(originProjectUuid) ?? null;
  }

  const inflight = inflightByOrigin.get(originProjectUuid);
  if (inflight !== undefined) {
    return inflight;
  }

  const request = (async () => {
    try {
      const linked =
        await CopilotProjectService.getLinkedProject(originProjectUuid);
      const uuid = linked?.projectUuid || linked?.uuid || null;
      linkedProjectUuidByOrigin.set(originProjectUuid, uuid);
      return uuid;
    } catch {
      return null;
    } finally {
      inflightByOrigin.delete(originProjectUuid);
    }
  })();

  inflightByOrigin.set(originProjectUuid, request);
  return request;
}

export function useCopilotConversationUrl(
  originProjectUuid: MaybeRefOrGetter<string | undefined>,
  room: MaybeRefOrGetter<CopilotConversationRoom | null | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const copilotProjectUuid = ref<string | undefined>(undefined);
  const isLoading = ref(false);

  const url = computed(() => {
    const projectUuid = copilotProjectUuid.value;
    const currentRoom = toValue(room);
    const roomUuid = currentRoom?.uuid;

    if (!projectUuid || !roomUuid) {
      return undefined;
    }

    return buildCopilotConversationsUrl({
      projectUuid,
      roomUuid,
      start: formatDate(currentRoom?.created_on),
      end: formatDate(currentRoom?.ended_at) || moment().format('YYYY-MM-DD'),
    });
  });

  watch(
    () => [toValue(enabled), toValue(originProjectUuid)] as const,
    async ([isEnabled, originUuid]) => {
      if (!isEnabled || !originUuid) {
        copilotProjectUuid.value = undefined;
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      const uuid = await resolveCopilotProjectUuid(originUuid);

      if (toValue(originProjectUuid) !== originUuid) {
        return;
      }

      copilotProjectUuid.value = uuid || undefined;
      isLoading.value = false;
    },
    { immediate: true },
  );

  return { url, isLoading };
}
