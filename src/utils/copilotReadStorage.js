import { moduleStorage } from '@/utils/storage';

export const MAX_COPILOT_READ_ROOMS = 200;
export const MAX_PROCESSED_UUIDS = 100;

export function buildCopilotReadStorageKey(projectUuid, agentEmail) {
  return `copilot_read_registry:${projectUuid}:${agentEmail}`;
}

export function buildCopilotReadEntryKey(channelUuid, roomUuid) {
  return `${channelUuid}:${roomUuid}`;
}

function isChannelRoomKey(key) {
  return typeof key === 'string' && key.includes(':');
}

function isValidEntry(entry) {
  return (
    !!entry &&
    typeof entry === 'object' &&
    typeof entry.messageUuid === 'string' &&
    entry.messageUuid &&
    typeof entry.processedAt === 'number' &&
    Number.isFinite(entry.processedAt)
  );
}

function normalizeProcessedUuids(entry) {
  const fromList = Array.isArray(entry.processedUuids)
    ? entry.processedUuids.filter((uuid) => typeof uuid === 'string' && uuid)
    : [];

  if (fromList.length) {
    return mergeProcessedUuids([], fromList);
  }

  return entry.messageUuid ? [entry.messageUuid] : [];
}

function mergeProcessedUuids(existing, incoming) {
  const merged = [...existing, ...incoming].filter(
    (uuid) => typeof uuid === 'string' && uuid,
  );
  const seen = new Set();
  const unique = [];

  for (let index = merged.length - 1; index >= 0; index -= 1) {
    const uuid = merged[index];
    if (seen.has(uuid)) {
      continue;
    }
    seen.add(uuid);
    unique.unshift(uuid);
  }

  return unique.slice(-MAX_PROCESSED_UUIDS);
}

function normalizeEntry(entry) {
  return {
    messageUuid: entry.messageUuid,
    createdOn: typeof entry.createdOn === 'string' ? entry.createdOn : '',
    processedAt: entry.processedAt,
    processedUuids: normalizeProcessedUuids(entry),
  };
}

function readMap(projectUuid, agentEmail) {
  if (!projectUuid || !agentEmail) {
    return {};
  }

  const raw = moduleStorage.getItem(
    buildCopilotReadStorageKey(projectUuid, agentEmail),
    null,
  );

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const cleaned = {};
  Object.entries(raw).forEach(([key, entry]) => {
    if (isChannelRoomKey(key) && isValidEntry(entry)) {
      cleaned[key] = normalizeEntry(entry);
    }
  });

  return cleaned;
}

function writeMap(projectUuid, agentEmail, map) {
  const key = buildCopilotReadStorageKey(projectUuid, agentEmail);

  if (!map || Object.keys(map).length === 0) {
    moduleStorage.removeItem(key);
    return;
  }

  moduleStorage.setItem(key, map);
}

function pruneLru(map) {
  const entries = Object.entries(map);
  if (entries.length <= MAX_COPILOT_READ_ROOMS) {
    return map;
  }

  entries.sort((left, right) => left[1].processedAt - right[1].processedAt);
  return Object.fromEntries(
    entries.slice(entries.length - MAX_COPILOT_READ_ROOMS),
  );
}

export function getLastProcessed(scope, roomUuid) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;
  const channelUuid = scope?.channelUuid;

  if (!projectUuid || !agentEmail || !channelUuid || !roomUuid) {
    return null;
  }

  return (
    readMap(projectUuid, agentEmail)[
      buildCopilotReadEntryKey(channelUuid, roomUuid)
    ] || null
  );
}

export function getProcessedUuids(scope, roomUuid) {
  const entry = getLastProcessed(scope, roomUuid);
  if (!entry) {
    return [];
  }

  return entry.processedUuids || [];
}

export function markProcessed(scope, roomUuid, payload) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;
  const channelUuid = scope?.channelUuid;

  if (
    !projectUuid ||
    !agentEmail ||
    !channelUuid ||
    !roomUuid ||
    !payload?.messageUuid
  ) {
    return;
  }

  const entryKey = buildCopilotReadEntryKey(channelUuid, roomUuid);
  const map = readMap(projectUuid, agentEmail);
  const existing = map[entryKey];
  const incomingUuids = Array.isArray(payload.processedUuids)
    ? payload.processedUuids
    : [payload.messageUuid];

  map[entryKey] = {
    messageUuid: payload.messageUuid,
    createdOn: payload.createdOn || existing?.createdOn || '',
    processedAt: Date.now(),
    processedUuids: mergeProcessedUuids(
      existing?.processedUuids || [],
      incomingUuids,
    ),
  };
  writeMap(projectUuid, agentEmail, pruneLru(map));
}

export function clearRoom(scope, roomUuid) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;

  if (!projectUuid || !agentEmail || !roomUuid) {
    return;
  }

  const map = readMap(projectUuid, agentEmail);
  const suffix = `:${roomUuid}`;
  let changed = false;

  Object.keys(map).forEach((key) => {
    if (key.endsWith(suffix) || key === roomUuid) {
      delete map[key];
      changed = true;
    }
  });

  if (!changed) {
    return;
  }

  writeMap(projectUuid, agentEmail, map);
}
