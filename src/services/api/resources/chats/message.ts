import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { getURLParams } from '@/utils/requests';

import type { PaginatedResponse, Message, Media } from './types';

interface SendRoomMessageParams {
  text: string;
  user_email?: string;
  seen?: boolean;
  repliedMessageId?: string;
}

interface SendRoomMediaParams {
  user_email: string;
  media: File;
  updateLoadingFiles?: (_uuid: string, _progress: number) => void;
  repliedMessageId?: string;
}

interface SendRoomMediaResponse {
  message_response: Message;
  media_response: Media;
}

interface SendDiscussionMediaParams {
  media: File;
  updateLoadingFiles?: (_uuid: string, _progress: number) => void;
}

export default {
  async getByRoom(
    { nextReq }: { nextReq: string | null },
    roomId: string,
  ): Promise<PaginatedResponse<Message>> {
    const endpoint = '/msg/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
      room: roomId,
      ordering: '-created_on',
      reverse_results: true,
    };

    let response;

    const featureFlagStore = useFeatureFlag();

    const featureFlags = featureFlagStore.featureFlags as {
      active_features?: string[];
    };

    const useV2 = featureFlags?.active_features?.includes('weniChatsV2Message');

    const config: Record<string, any> = useV2
      ? {
          baseURL: http.defaults.baseURL.replace('/v1', '/v2'),
        }
      : {};

    if (nextReq && paramsNextReq) {
      response = await http.get(`${endpoint}${paramsNextReq}`, config);
    } else {
      response = await http.get(endpoint, { params, ...config });
    }

    return response.data;
  },

  async getByDiscussion(
    { nextReq }: { nextReq: string | null },
    discussionUuid: string,
    offset?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Message>> {
    const endpoint = `discussion/${discussionUuid}/list_messages/`;
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
      ordering: '-created_on',
      reverse_results: true,
      offset,
      limit,
    };

    let response;

    if (nextReq && paramsNextReq) {
      response = await http.get(`${endpoint}${paramsNextReq}`);
    } else {
      response = await http.get(endpoint, { params });
    }

    return response.data;
  },

  async getByContact(
    contactUuid: string,
    offset: number,
    limit: number,
    { onlyClosedRooms = true }: { onlyClosedRooms?: boolean } = {},
  ): Promise<PaginatedResponse<Message>> {
    const response = await http.get('/msg/', {
      params: {
        ordering: '-created_on',
        reverse_results: true,
        contact: contactUuid,
        project: getProject(),
        is_active: !onlyClosedRooms,
        offset,
        limit,
      },
    });
    return response.data;
  },

  async sendRoomMessage(
    roomId: string,
    { text, user_email, seen, repliedMessageId }: SendRoomMessageParams,
  ): Promise<Message> {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email,
      seen,
      replied_message_id: repliedMessageId,
    });
    return response.data;
  },

  async sendDiscussionMessage(
    discussionUuid: string,
    { text }: { text: string },
  ): Promise<Message> {
    const response = await http.post(
      `/discussion/${discussionUuid}/send_messages/`,
      {
        text,
      },
    );
    return response.data;
  },

  async sendRoomMedia(
    roomId: string,
    {
      user_email,
      media,
      updateLoadingFiles,
      repliedMessageId,
    }: SendRoomMediaParams,
  ): Promise<SendRoomMediaResponse> {
    const msg = await this.sendRoomMessage(roomId, {
      text: '',
      user_email,
      seen: true,
    });
    updateLoadingFiles?.(msg.uuid, 0);
    const response = await http.postForm(
      '/media/',
      {
        content_type: media.type,
        message: msg.uuid,
        media_file: media,
        replied_message_id: repliedMessageId,
      },
      {
        onUploadProgress: (event: any) => {
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(msg.uuid, progress);
        },
      },
    );

    return { message_response: msg, media_response: response.data };
  },

  async sendDiscussionMedia(
    discussionUuid: string,
    { media, updateLoadingFiles }: SendDiscussionMediaParams,
  ): Promise<Media | undefined> {
    const mediaUuid = media.name + Date.now();

    updateLoadingFiles?.(mediaUuid, 0);
    const response = await http.postForm(
      `/discussion/${discussionUuid}/send_media_messages/`,
      {
        content_type: media.type,
        text: '',
        media_file: media,
      },
      {
        onUploadProgress: (event: any) => {
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(mediaUuid, progress);
        },
      },
    );
    return response.data?.media?.[0];
  },
};
