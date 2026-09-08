import { moduleStorage } from '@/utils/storage';
import { getProject } from '@/utils/config';

const STORAGE_KEY = 'queuesView';

function readMap() {
  const raw = moduleStorage.getItem(STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw;
}

function writeMap(map) {
  if (!map || Object.keys(map).length === 0) {
    moduleStorage.removeItem(STORAGE_KEY);
    return;
  }
  moduleStorage.setItem(STORAGE_KEY, map);
}

function resolveProjectUuid(projectUuid) {
  return projectUuid || getProject();
}

export function getSelectedQueues(projectUuid) {
  const uuid = resolveProjectUuid(projectUuid);
  if (!uuid) return [];

  const entry = readMap()[uuid];
  if (!entry || !Array.isArray(entry.selectedQueues)) {
    return [];
  }
  return entry.selectedQueues;
}

export function setSelectedQueues(projectUuid, selectedQueues) {
  const uuid = resolveProjectUuid(projectUuid);
  if (!uuid) return;

  const queues = Array.isArray(selectedQueues) ? selectedQueues : [];
  const map = readMap();
  map[uuid] = { selectedQueues: queues };
  writeMap(map);
}
