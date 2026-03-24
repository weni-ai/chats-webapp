import SoundNotification from '@/services/api/websocket/soundNotification';

import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { getRoomType } from '@/utils/room';

const BATCH_FLUSH_DELAY_MS = 80;
const MAX_BATCH_WAIT_MS = 500;

const pendingUpdates = new Map();
const notifiedRoomUuids = new Set();
let batchTimeoutId = null;
let batchStartTime = null;
let lastAppRef = null;

function processBatch() {
  batchTimeoutId = null;
  batchStartTime = null;
  const app = lastAppRef;

  if (!app || pendingUpdates.size === 0) return;

  const updates = new Map(pendingUpdates);
  pendingUpdates.clear();
  notifiedRoomUuids.clear();

  const roomsStore = useRooms();
  const counters = useRoomCounters();

  for (const [, room] of updates) {
    const result = roomsStore.updateRoom({
      room,
      userEmail: app.me.email,
      routerReplace: () => app.$router.replace({ name: 'home' }),
      viewedAgentEmail: app.viewedAgent.email,
    });

    if (result) {
      counters.handleRoomUpdate(result);
    }

    if (room.unread_msgs === 0) {
      roomsStore.resetNewMessagesByRoom({ room: room.uuid });
    }
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
  pendingUpdates.clear();
  notifiedRoomUuids.clear();
  batchTimeoutId = null;
  batchStartTime = null;
  lastAppRef = null;
}

export default async (room, { app }) => {
  const roomsStore = useRooms();
  lastAppRef = app;

  const featureFlagStore = useFeatureFlag();
  const useLegacy =
    featureFlagStore.featureFlags?.active_features?.includes(
      'weniChatsLegacyRoomUpdate',
    ) ?? true;
  if (useLegacy) {
    return handleUpdateLegacy(room, app, roomsStore);
  }

  const isKnown =
    roomsStore.rooms.some((r) => r.uuid === room.uuid) ||
    pendingUpdates.has(room.uuid);

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

  pendingUpdates.set(room.uuid, room);
  scheduleBatch();
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
