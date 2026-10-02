import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export type RawHistoryMessage = {
  id: number;
  contact: { uuid: string; name: string } | null;
  urn: string | null;
  channel: { uuid: string; name: string } | null;
  direction: 'in' | 'out';
  text: string;
  created_on: string;
};

export type HistoryMessagesResponse = {
  next: string | null;
  previous: string | null;
  results: RawHistoryMessage[];
};

type GetMessagesParams = {
  roomUuid: string;
  cursor?: string;
};

export default {
  /**
   * Lists Copilot messages for a closed room via the chats-engine proxy of
   * GET /api/v2/internals/messages (contact_urn = room uuid).
   */
  async getMessages({
    roomUuid,
    cursor,
  }: GetMessagesParams): Promise<HistoryMessagesResponse> {
    const response = await http.get<HistoryMessagesResponse>(
      `/room/${roomUuid}/copilot/messages/`,
      {
        params: {
          project: getProject(),
          ...(cursor ? { cursor } : {}),
        },
      },
    );

    return response.data;
  },
};
