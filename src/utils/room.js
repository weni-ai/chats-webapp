export const getRoomType = (room) => {
  if (!room.is_waiting && !room.user) return 'waiting';
  if (!!room.user && !room.is_waiting) return 'ongoing';
  if (room.is_waiting) return 'flow_start';
  return 'unknown';
};

export const parseUrn = (room) => {
  if (!room?.urn) return {};
  const plataform = room.urn.split(':').at(0);
  const number = room.urn.split(':').at(-1);
  const whatsapp = `+${number.substr(-20, 20)}`;
  const infoNumber = {
    plataform,
    contactNum: plataform === 'whatsapp' ? whatsapp : number,
  };
  return infoNumber;
};
