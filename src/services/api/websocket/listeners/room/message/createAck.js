import {
  resolvePendingRequest,
  rejectPendingRequest,
} from '@/services/api/websocket/pendingRequests';
import { SocketMessageCreateError } from '@/services/api/websocket/errors';

export function success(content) {
  const requestId = content?.request_id;

  if (!requestId) {
    console.warn(
      '[WebSocket] msg.create.success received without request_id',
      content,
    );
    return;
  }

  resolvePendingRequest(requestId, content);
}

export function error(content) {
  const requestId = content?.request_id;

  if (!requestId) {
    console.warn(
      '[WebSocket] msg.create.error received without request_id',
      content,
    );
    return;
  }

  rejectPendingRequest(
    requestId,
    new SocketMessageCreateError(content.error_code, content.error_message),
  );
}

export default {
  success,
  error,
};
