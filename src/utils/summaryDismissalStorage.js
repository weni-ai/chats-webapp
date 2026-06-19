import { moduleStorage } from '@/utils/storage';

const STORAGE_KEY = 'summary_dismissed_rooms';

export const SUMMARY_DISMISSAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function isExpired(timestamp, now = Date.now()) {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return true;
  return now - timestamp >= SUMMARY_DISMISSAL_TTL_MS;
}

export function markSummaryDismissed(roomUuid) {
  if (!roomUuid || typeof roomUuid !== 'string') return;
  const map = readMap();
  map[roomUuid] = Date.now();
  writeMap(map);
}

export function clearSummaryDismissed(roomUuid) {
  if (!roomUuid || typeof roomUuid !== 'string') return;
  const map = readMap();
  if (!(roomUuid in map)) return;
  delete map[roomUuid];
  writeMap(map);
}

export function isSummaryDismissed(roomUuid) {
  if (!roomUuid || typeof roomUuid !== 'string') return false;
  const map = readMap();
  const timestamp = map[roomUuid];
  if (timestamp === undefined) return false;

  if (isExpired(timestamp)) {
    delete map[roomUuid];
    writeMap(map);
    return false;
  }
  return true;
}

export function pruneExpiredSummaryDismissals() {
  const map = readMap();
  const now = Date.now();
  let changed = false;
  for (const [uuid, timestamp] of Object.entries(map)) {
    if (isExpired(timestamp, now)) {
      delete map[uuid];
      changed = true;
    }
  }
  if (changed) writeMap(map);
}
