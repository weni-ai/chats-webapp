import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { useProfile } from '@/store/modules/profile';
import { getURLParams } from '@/utils/requests';
import i18n from '@/plugins/i18n';

import type { AxiosResponse, PaginatedResponse, Room, Tag } from './types';

interface RoomListResponse extends PaginatedResponse<Room> {
  max_pin_limit?: number;
}

interface SummaryResponse {
  status: string;
  summary: string;
  feedback: any;
}

interface SummaryFeedbackTagsResponse {
  results: Record<string, string>;
}

interface CanUseCopilotResponse {
  can_use_chat_completion: boolean;
}

interface CanSendMessageResponse {
  can_send_message: boolean;
}

interface SummaryFeedbackParams {
  roomUuid: string;
  liked: boolean;
  text?: string;
  tags?: string[];
}

interface BulkTransferParams {
  rooms?: string[];
  intended_agent?: string;
  intended_queue?: string;
}

interface BulkCloseParams {
  rooms?: string[];
  end_by?: string;
  closed_by_email?: string;
}

export default {
  async getAll(
    offset: number,
    limit: number,
    contact: string,
    order: string,
    viewedAgent?: string,
    roomsType?: string,
  ): Promise<RoomListResponse> {
    const params: Record<string, any> = {
      is_active: true,
      project: getProject(),
      offset,
      limit,
      ordering: order,
      search: contact,
      room_status: roomsType,
    };

    if (viewedAgent) {
      params.email = viewedAgent;
    }

    const response = await http.get('/room/', {
      params,
    });

    return response.data;
  },

  async getByUuid({ uuid }: { uuid: string }): Promise<Room | void> {
    if (uuid) {
      const response = await http.get(`/room/${uuid}/`);
      return response.data;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getSummaryFeedbackTags(): Promise<SummaryFeedbackTagsResponse> {
    const response = await http.get(
      '/ai_features/history_summary/feedback/tags/',
      {
        headers: {
          'Accept-Language': i18n.global.locale,
        },
      },
    );
    return response.data;
  },

  async sendSummaryFeedback({
    roomUuid,
    liked,
    text,
    tags,
  }: SummaryFeedbackParams): Promise<any> {
    const response = await http.post(
      `/room/${roomUuid}/chats-summary/feedback/`,
      { liked, text, tags },
    );
    return response.data;
  },

  async getSummary({
    roomUuid,
  }: {
    roomUuid: string;
  }): Promise<SummaryResponse> {
    const url = `/room/${roomUuid}/chats-summary/`;
    const response = await http.get(url);

    return response.data;
  },

  async getCanUseCopilot({
    uuid,
  }: {
    uuid: string;
  }): Promise<CanUseCopilotResponse | void> {
    if (uuid) {
      const response = await http.get(`/room/${uuid}/chat_completion/`);
      return response.data;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getCopilotSuggestion({ uuid }: { uuid: string }): Promise<any> {
    if (uuid) {
      const response = await http
        .post(`/room/${uuid}/chat_completion/`)
        .then((response) => response.data)
        .catch((error) => error.response);
      return response;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getClosed(): Promise<PaginatedResponse<Room>> {
    const response = await http.get('/room/', {
      params: { is_active: false },
    });
    return response.data;
  },

  async close(uuid: string, tags: string[] = []): Promise<any> {
    const response = await http.put(`/room/${uuid}/close/`, { tags });
    return response.data;
  },

  async updateReadMessages(uuid: string, read: boolean): Promise<void> {
    await http.patch(`/room/${uuid}/bulk_update_msgs/`, {
      seen: read,
    });
  },

  async take(
    uuid: string,
    email?: string | null,
    queueUuid?: string,
  ): Promise<any> {
    const response = await http.put(
      `/room/${uuid}/`,
      email ? { user_email: email } : { queue_uuid: queueUuid },
    );
    return response.data;
  },

  async getQueueRoom(uuid: string): Promise<any> {
    const profileStore = useProfile();
    const { me } = profileStore;
    const response = await http.patch(
      `/room/${uuid}/pick_queue_room/?user_email=${(me as { email: string })?.email}`,
    );
    return response.data;
  },

  async updateCustomFields(
    uuid: string,
    customFields: Record<string, any> = {},
  ): Promise<any> {
    const response = await http.patch(
      `/room/${uuid}/update_custom_fields/`,
      customFields,
    );
    return response.data;
  },

  async getRoomTags(
    roomUuid: string,
    { limit = 20, next = '' }: { limit?: number; next?: string },
  ): Promise<PaginatedResponse<Tag>> {
    const nextParams: Record<string, any> = next
      ? getURLParams({ URL: next, endpoint: '/tag/', returnObject: true })
      : {};
    const params = { ...nextParams, limit: nextParams.limit || limit };
    const response = await http.get(`/room/${roomUuid}/tags/`, { params });
    return response.data;
  },

  async addRoomTag(roomUuid: string, tagUuid: string): Promise<AxiosResponse> {
    const response = await http.post(`/room/${roomUuid}/tags/add/`, {
      uuid: tagUuid,
    });
    return response;
  },

  async removeRoomTag(
    roomUuid: string,
    tagUuid: string,
  ): Promise<AxiosResponse> {
    const response = await http.post(`/room/${roomUuid}/tags/remove/`, {
      uuid: tagUuid,
    });
    return response;
  },

  async bulkTranfer({
    rooms = [],
    intended_agent = '',
    intended_queue = '',
  }: BulkTransferParams): Promise<AxiosResponse> {
    const profileStore = useProfile();
    const { email: user_email } = (profileStore as any).me as {
      email: string;
    };
    const body = { rooms_list: rooms };
    const params = {
      user_request: user_email,
      user_email: intended_agent,
      queue_uuid: intended_queue,
    };

    const response = await http
      .patch(`room/bulk_transfer/`, body, { params })
      .then((response) => response)
      .catch((error) => error.response);
    return response;
  },

  async bulkClose({
    rooms = [],
    end_by = 'system',
    closed_by_email = '',
  }: BulkCloseParams): Promise<AxiosResponse> {
    const profileStore = useProfile();
    const { email: user_email } = (profileStore as any).me as {
      email: string;
    };

    const body = {
      rooms,
      end_by: end_by || 'system',
      closed_by_email: closed_by_email || user_email,
    };

    const response = await http
      .post(`/room/bulk_close/`, body)
      .then((response) => response)
      .catch((error) => error.response);
    return response;
  },

  async pinRoom({
    uuid,
    status = true,
  }: {
    uuid: string;
    status?: boolean;
  }): Promise<any> {
    const response = await http.post(`/room/${uuid}/pin/`, {
      status,
    });

    return response.data;
  },

  async getCanSendMessageStatus(uuid: string): Promise<CanSendMessageResponse> {
    const response = await http.get(`/room/${uuid}/can-send-message-status/`);

    return response.data;
  },
};
