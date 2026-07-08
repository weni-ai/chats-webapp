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

export const buildHistoryContactQuery = (room) => {
  const query = {};
  const externalId = room?.contact?.external_id;
  const email = room?.contact?.email;
  const document = sanitizeDocument(room?.contact?.document);

  if (externalId) query.contact = externalId;
  if (email) query.email = email;
  if (document) query.document = document;

  return query;
};
