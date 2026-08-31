import { createPendingRequest } from './pendingRequests';
import { getActiveConnection, isSocketOpen } from './connectionRegistry';
import { SocketNotConnectedError } from './errors';

const MESSAGE_CREATE_TIMEOUT_MS = 15000; // 15 seconds

export async function sendRoomMessageBySocket({
  room,
  text,
  aiTextImprovement,
  requestId,
  media,
  externalId,
}) {
  if (!isSocketOpen()) {
    throw new SocketNotConnectedError();
  }

  const promise = createPendingRequest(requestId, {
    timeoutMs: MESSAGE_CREATE_TIMEOUT_MS,
  });

  const content = {
    request_id: requestId,
    room,
    text,
  };

  if (externalId) {
    content.reply_to = { external_id: externalId };
  }

  if (aiTextImprovement) {
    content.ai_text_improvement = aiTextImprovement;
  }

  if (Array.isArray(media) && media.length) {
    content.media = media;
  }

  getActiveConnection().ws.send({
    type: 'method',
    action: 'message_create',
    content,
  });

  return promise;
}
