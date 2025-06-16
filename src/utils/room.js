export const getRoomType = (room) => {
  if (!room.is_waiting && !room.user) return 'waiting';
  if (!!room.user && !room.is_waiting) return 'ongoing';
  if (room.is_waiting) return 'sent_flows';
  return 'unknown';
};
