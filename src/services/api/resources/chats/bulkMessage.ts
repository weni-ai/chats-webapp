import http from '@/services/api/http';
import { getProject } from '@/utils/config';

interface CountRoomsParams {
  agents?: string[];
  queues?: string[];
  status?: string[];
}

interface SendMessageParams {
  text: string;
  status: string[];
  queues: string[];
  agents: string[];
}

interface MessageSent {
  uuid: string;
  text: string;
  sent_at: string;
}

interface ShippingHistoryParams {
  start_date?: string;
  end_date?: string;
  sender?: string;
  status?: string;
  offset?: number;
  limit?: number;
}

interface ShippingHistoryItem {
  contact?: { name?: string };
  queue?: { name?: string };
  sent_by?: { name?: string };
  date: string;
  status: string;
}

export default {
  async countRooms({
    agents,
    queues,
    status,
  }: CountRoomsParams): Promise<{ count: number }> {
    const endpoint = '/msg/bulk-send/rooms/';

    const params = {
      project: getProject(),
      agents: agents?.includes('all') ? undefined : agents?.join(','),
      queues: queues?.includes('all') ? undefined : queues?.join(','),
      status: status?.join(','),
    };

    const response = await http.get(endpoint, { params });

    return response.data;
  },
  async sendMessage({
    text,
    status,
    queues,
    agents,
  }: SendMessageParams): Promise<{ status: string; uuid: string }> {
    const endpoint = '/msg/bulk-send/';

    const bodyData = {
      project: getProject(),
      text,
      status,
      queues: queues?.includes('all') ? [] : queues,
      agents: agents?.includes('all') ? [] : agents,
    };

    const response = await http.post(endpoint, bodyData);

    return response.data;
  },
  async getLastSentMessages(): Promise<Array<MessageSent>> {
    const endpoint = '/msg/bulk-send/recent-history/';

    const params = {
      project: getProject(),
    };

    const response = await http.get(endpoint, { params });

    return response.data.results;
  },
  async checkIfHasShippingHistory(): Promise<boolean> {
    const endpoint = '/msg/bulk-send/has-past-messages/';

    const params = {
      project: getProject(),
    };

    const response = await http.get(endpoint, { params });

    return response.data.status;
  },
  async getShippingHistory({
    start_date,
    end_date,
    sender,
    status,
    offset = 0,
    limit = 5,
  }: ShippingHistoryParams): Promise<{
    count: number;
    results: ShippingHistoryItem[];
  }> {
    const endpoint = '/msg/bulk-send/history/';

    const params = {
      project: getProject(),
      start_date,
      end_date,
      sender,
      status,
      offset,
      limit,
    };

    const response = await http.get(endpoint, { params });

    return response.data;
  },
};
