import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

export default {
  async getAll({ nextQuickMessages = '' }) {
    const endpoint = '/quick_messages/';
    const params = getURLParams({ URL: nextQuickMessages, endpoint });

    const url = nextQuickMessages ? `${endpoint}${params}` : endpoint;
    const response = await http.get(url);

    return response.data;
  },

  async getAllBySector({ nextQuickMessagesShared = '' }) {
    const projectUuid = await getProject();
    const endpoint = `/sector_quick_messages/`;
    const params = getURLParams({ URL: nextQuickMessagesShared, endpoint });

    const url = nextQuickMessagesShared
      ? `${endpoint}${params}`
      : `${endpoint}?project=${projectUuid}`;
    const response = await http.get(url);

    return response.data;
  },

  async getAllV2({ nextQuickMessages = '' }) {
    const endpoint = '/v2/quick_messages/';
    const params = getURLParams({ URL: nextQuickMessages, endpoint });

    const url = nextQuickMessages ? `${endpoint}${params}` : endpoint;
    const response = await http.get(url);

    return response.data;
  },

  async getBySectorV2({ sectorUuid, next = '' }) {
    const projectUuid = await getProject();
    const endpoint = '/v2/sector_quick_messages/';
    const params = getURLParams({ URL: next, endpoint });

    const url = next
      ? `${endpoint}${params}`
      : `${endpoint}?sector=${sectorUuid}&project=${projectUuid}`;
    const response = await http.get(url);

    return response.data;
  },

  async getByProjectV2({ next = '' }) {
    const projectUuid = await getProject();
    const endpoint = '/v2/sector_quick_messages/';
    const params = getURLParams({ URL: next, endpoint });

    const url = next
      ? `${endpoint}${params}`
      : `${endpoint}?project=${projectUuid}`;
    const response = await http.get(url);

    return response.data;
  },

  async create({ title, text, shortcut = null }) {
    const response = await http.post('/quick_messages/', {
      title,
      text,
      shortcut,
    });

    return response.data;
  },

  async createBySector({ sectorUuid, title, text, shortcut = null }) {
    const response = await http.post('/sector_quick_messages/', {
      sector: sectorUuid,
      title,
      text,
      shortcut,
    });

    return response.data;
  },

  async update(uuid, { title, text, shortcut = null }) {
    const response = await http.patch(`/quick_messages/${uuid}/`, {
      title,
      text,
      shortcut,
    });

    return response.data;
  },

  async updateBySector(quickMessageUuid, { title, text, shortcut = null }) {
    const response = await http.patch(
      `/sector_quick_messages/${quickMessageUuid}/`,
      {
        title,
        text,
        shortcut,
      },
    );

    return response.data;
  },

  async delete(uuid) {
    const response = await http.delete(`/quick_messages/${uuid}/`);
    return response.data;
  },

  async deleteBySector(quickMessageUuid) {
    const response = await http.delete(
      `/sector_quick_messages/${quickMessageUuid}/`,
    );
    return response.data;
  },
};
