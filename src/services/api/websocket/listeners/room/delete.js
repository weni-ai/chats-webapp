import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { getRoomType } from '@/utils/room';

import { enqueueRoomEvent, setAppRef } from './update';

const handleRoomClose = async (room, context) => {
  if (!room?.uuid) return;

  if (context?.app) setAppRef(context.app);

  const featureFlagStore = useFeatureFlag();
  const useNewRoomUpdate =
    featureFlagStore.featureFlags?.active_features?.includes(
      'WeniChatsNewRoomUpdate',
    );

  if (!useNewRoomUpdate) {
    const roomsStore = useRooms();
    const counters = useRoomCounters();

    const existingRoom = roomsStore.rooms.find((r) => r.uuid === room.uuid);
    const roomType = existingRoom
      ? getRoomType(existingRoom)
      : getRoomType(room);

    roomsStore.removeRoom(room.uuid);
    counters.handleClose(roomType);
    return;
  }

  enqueueRoomEvent({ kind: 'close', room });
};

export default handleRoomClose;
