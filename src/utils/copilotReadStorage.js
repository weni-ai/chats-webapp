import { moduleStorage } from '@/utils/storage';

export const MAX_COPILOT_READ_ROOMS = 200;

export function buildCopilotReadStorageKey(projectUuid, agentEmail) {
  return `copilot_read_registry:${projectUuid}:${agentEmail}`;
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
  Object.entries(raw).forEach(([roomUuid, entry]) => {
    if (isValidEntry(entry)) {
      cleaned[roomUuid] = {
        messageUuid: entry.messageUuid,
        createdOn: typeof entry.createdOn === 'string' ? entry.createdOn : '',
        processedAt: entry.processedAt,
      };
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

  if (!projectUuid || !agentEmail || !roomUuid) {
    return null;
  }

  return readMap(projectUuid, agentEmail)[roomUuid] || null;
}

export function markProcessed(scope, roomUuid, payload) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;

  if (!projectUuid || !agentEmail || !roomUuid || !payload?.messageUuid) {
    return;
  }

  const map = readMap(projectUuid, agentEmail);
  map[roomUuid] = {
    messageUuid: payload.messageUuid,
    createdOn: payload.createdOn || '',
    processedAt: Date.now(),
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
  if (!(roomUuid in map)) {
    return;
  }

  delete map[roomUuid];
  writeMap(projectUuid, agentEmail, map);
}
