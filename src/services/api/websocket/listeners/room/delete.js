import { enqueueRoomEvent, setAppRef } from './update';

const handleRoomClose = async (room, context) => {
  if (!room?.uuid) return;

  if (context?.app) setAppRef(context.app);

  enqueueRoomEvent({ kind: 'close', room });
};

export default handleRoomClose;
