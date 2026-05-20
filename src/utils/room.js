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

export const sanitizeDocument = (doc) => {
  if (!doc) return '';
  return doc.replaceAll(/[^a-zA-Z0-9]/g, '');
};

export const buildHistorySearchTerm = (room) => {
  const { plataform, contactNum } = parseUrn(room);
  const contactUrn =
    plataform === 'whatsapp' ? contactNum.replace('+', '') : contactNum;

  const parts = [];
  if (contactUrn) parts.push(contactUrn);
  if (room?.contact?.email) parts.push(room.contact.email);
  if (room?.contact?.document)
    parts.push(sanitizeDocument(room.contact.document));

  return parts.join(',');
};
