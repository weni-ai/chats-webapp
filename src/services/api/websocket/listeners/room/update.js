import SoundNotification from '@/services/api/websocket/soundNotification';

import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { getRoomType } from '@/utils/room';

const BATCH_FLUSH_DELAY_MS = 80;
const MAX_BATCH_WAIT_MS = 500;
const RECONCILIATION_DELAY_MS = 1500;
const RECONCILIATION_MIN_BATCH_SIZE = 5;
const RECENTLY_CLOSED_TTL_MS = 5000;
const RECONCILIATION_LIMIT = 100;

const pendingEvents = new Map();
const notifiedRoomUuids = new Set();
const pendingClosedUuids = new Set();
const recentlyClosedUuids = new Map();

let batchTimeoutId = null;
let batchStartTime = null;
let lastAppRef = null;
let totalBatchedInBurst = 0;
let burstTouchedTypes = new Set();
let reconciliationTimeoutId = null;
let pendingReconciliationTypes = new Set();

function cleanupExpiredRecentlyClosed() {
  const now = Date.now();
  for (const [uuid, expiry] of recentlyClosedUuids) {
    if (expiry <= now) recentlyClosedUuids.delete(uuid);
  }
}

function markRecentlyClosed(uuid) {
  if (!uuid) return;
  recentlyClosedUuids.set(uuid, Date.now() + RECENTLY_CLOSED_TTL_MS);
}

function isRecentlyClosed(uuid) {
  if (!uuid) return false;
  cleanupExpiredRecentlyClosed();
  return recentlyClosedUuids.has(uuid);
}

export function markPendingClose(uuid) {
  if (!uuid) return;
  pendingClosedUuids.add(uuid);
  markRecentlyClosed(uuid);
  setTimeout(() => {
    pendingClosedUuids.delete(uuid);
  }, RECENTLY_CLOSED_TTL_MS);
}

export function unmarkPendingClose(uuid) {
  if (!uuid) return;
  pendingClosedUuids.delete(uuid);
}

export function enqueueRoomEvent({ kind, room }) {
  if (!room?.uuid) return;
  if (kind === 'close') {
    pendingEvents.set(room.uuid, { kind: 'close', room });
  } else {
    const existing = pendingEvents.get(room.uuid);
    if (existing?.kind === 'close') return;
    pendingEvents.set(room.uuid, { kind: 'update', room });
  }
  scheduleBatch();
}

function scheduleReconciliation(types) {
  if (!types || types.size === 0) return;
  for (const type of types) pendingReconciliationTypes.add(type);

  if (reconciliationTimeoutId !== null) clearTimeout(reconciliationTimeoutId);

  reconciliationTimeoutId = setTimeout(async () => {
    reconciliationTimeoutId = null;
    const typesToReconcile = new Set(pendingReconciliationTypes);
    pendingReconciliationTypes.clear();
    totalBatchedInBurst = 0;
    burstTouchedTypes = new Set();

    if (typesToReconcile.size === 0) return;

    const roomsStore = useRooms();
    const viewedAgentEmail = lastAppRef?.viewedAgent?.email;

    for (const roomsType of typesToReconcile) {
      try {
        await roomsStore.getAll({
          offset: 0,
          concat: true,
          limit: RECONCILIATION_LIMIT,
          roomsType,
          order: roomsStore.orderBy?.[roomsType],
          viewedAgent: viewedAgentEmail || undefined,
          cleanRoomType: roomsType,
        });
      } catch (error) {
        console.error('[rooms.update] Reconciliation failed', roomsType, error);
      }
    }
  }, RECONCILIATION_DELAY_MS);
}

function promoteInactiveUpdates(events) {
  for (const [uuid, evt] of events) {
    if (evt.kind === 'update' && evt.room?.is_active === false) {
      events.set(uuid, { kind: 'close', room: evt.room });
    }
  }
}

function processCloseEvents(events, roomsStore, counters, touchedTypes) {
  const closedThisBatch = new Set();
  for (const [uuid, evt] of events) {
    if (evt.kind !== 'close') continue;
    const wasOptimisticallyClosed = pendingClosedUuids.has(uuid);
    const roomType = roomsStore.applyClose(uuid, evt.room);

    if (!wasOptimisticallyClosed && roomType) {
      counters.handleClose(roomType);
    }

    counters.clearTypeCache(uuid);
    pendingClosedUuids.delete(uuid);
    markRecentlyClosed(uuid);
    closedThisBatch.add(uuid);
    if (roomType) touchedTypes.add(roomType);
  }
  return closedThisBatch;
}

function processSingleUpdate(evt, app, roomsStore, counters, touchedTypes) {
  const room = evt.room;
  const result = roomsStore.updateRoom({
    room,
    userEmail: app.me.email,
    routerReplace: () => app.$router.replace({ name: 'home' }),
    viewedAgentEmail: app.viewedAgent.email,
    alreadyClosedThisBatch: false,
  });

  if (result) {
    counters.handleRoomUpdate(result);
    if (result.oldType) touchedTypes.add(result.oldType);
    if (result.newType) touchedTypes.add(result.newType);
  }

  if (room.unread_msgs === 0) {
    roomsStore.resetNewMessagesByRoom({ room: room.uuid });
  }
}

function processUpdateEvents({
  events,
  closedThisBatch,
  app,
  roomsStore,
  counters,
  touchedTypes,
}) {
  for (const [uuid, evt] of events) {
    if (evt.kind !== 'update') continue;
    if (closedThisBatch.has(uuid)) continue;
    if (isRecentlyClosed(uuid)) continue;

    processSingleUpdate(evt, app, roomsStore, counters, touchedTypes);
  }
}

function processBatch() {
  batchTimeoutId = null;
  batchStartTime = null;
  const app = lastAppRef;

  if (!app || pendingEvents.size === 0) return;

  const events = new Map(pendingEvents);
  pendingEvents.clear();
  notifiedRoomUuids.clear();

  promoteInactiveUpdates(events);

  const roomsStore = useRooms();
  const counters = useRoomCounters();
  const touchedTypes = new Set();

  const closedThisBatch = processCloseEvents(
    events,
    roomsStore,
    counters,
    touchedTypes,
  );
  processUpdateEvents({
    events,
    closedThisBatch,
    app,
    roomsStore,
    counters,
    touchedTypes,
  });

  totalBatchedInBurst += events.size;
  for (const t of touchedTypes) burstTouchedTypes.add(t);

  if (totalBatchedInBurst >= RECONCILIATION_MIN_BATCH_SIZE) {
    scheduleReconciliation(burstTouchedTypes);
  }
}

function scheduleBatch() {
  if (batchTimeoutId !== null) clearTimeout(batchTimeoutId);

  const now = Date.now();
  if (batchStartTime === null) batchStartTime = now;

  const elapsed = now - batchStartTime;
  const delay =
    elapsed >= MAX_BATCH_WAIT_MS
      ? 0
      : Math.min(BATCH_FLUSH_DELAY_MS, MAX_BATCH_WAIT_MS - elapsed);

  batchTimeoutId = setTimeout(processBatch, delay);
}

export function flushPendingUpdates() {
  if (batchTimeoutId !== null) {
    clearTimeout(batchTimeoutId);
  }
  processBatch();
}

export function resetBatchState() {
  if (batchTimeoutId !== null) clearTimeout(batchTimeoutId);
  if (reconciliationTimeoutId !== null) clearTimeout(reconciliationTimeoutId);
  pendingEvents.clear();
  notifiedRoomUuids.clear();
  pendingClosedUuids.clear();
  recentlyClosedUuids.clear();
  pendingReconciliationTypes.clear();
  burstTouchedTypes = new Set();
  batchTimeoutId = null;
  batchStartTime = null;
  reconciliationTimeoutId = null;
  totalBatchedInBurst = 0;
  lastAppRef = null;
}

export function setAppRef(app) {
  lastAppRef = app;
}

export default async (room, { app }) => {
  const roomsStore = useRooms();
  lastAppRef = app;

  const featureFlagStore = useFeatureFlag();
  const useNewRoomUpdate =
    featureFlagStore.featureFlags?.active_features?.includes(
      'WeniChatsNewRoomUpdate',
    );
  if (!useNewRoomUpdate) {
    return handleUpdateLegacy(room, app, roomsStore);
  }

  const isKnown =
    roomsStore.rooms.some((r) => r.uuid === room.uuid) ||
    pendingEvents.has(room.uuid);

  const roomType = getRoomType(room);
  const isRoomForMe = room.user?.email === app.me.email;

  if (!isKnown && !notifiedRoomUuids.has(room.uuid)) {
    notifiedRoomUuids.add(room.uuid);
    if (room.transfer_history?.action === 'transfer') {
      new SoundNotification('achievement-confirmation').notify();
    }
    if (room.transfer_history?.action === 'forward') {
      new SoundNotification('select-sound').notify();
    }
  }

  if (
    roomType === 'ongoing' &&
    roomsStore.activeTab !== 'ongoing' &&
    isRoomForMe
  ) {
    roomsStore.showOngoingDot = true;
  }

  enqueueRoomEvent({ kind: 'update', room });
};

function handleUpdateLegacy(room, app, roomsStore) {
  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  const roomType = getRoomType(room);
  const isOngoingTab = roomsStore.activeTab === 'ongoing';
  const isRoomForMe = room.user?.email === app.me.email;

  if (!isExistingRoom) {
    roomsStore.addRoom(room);

    if (room.transfer_history?.action === 'transfer') {
      new SoundNotification('achievement-confirmation').notify();
    }
    if (room.transfer_history?.action === 'forward') {
      new SoundNotification('select-sound').notify();
    }
  }

  if (roomType === 'ongoing' && !isOngoingTab && isRoomForMe) {
    roomsStore.showOngoingDot = true;
  }

  const result = roomsStore.updateRoom({
    room,
    userEmail: app.me.email,
    routerReplace: () => app.$router.replace({ name: 'home' }),
    viewedAgentEmail: app.viewedAgent.email,
  });

  if (result) {
    const counters = useRoomCounters();
    counters.handleRoomUpdate(result);
  }

  if (room.unread_msgs === 0) {
    roomsStore.resetNewMessagesByRoom({ room: room.uuid });
  }
}
