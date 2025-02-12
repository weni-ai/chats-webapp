import http from '@/services/api/http';
import { getProject } from '@/utils/config';

function getURLParams({ URL }) {
  return Object.fromEntries(new URLSearchParams(URL?.split('?')?.[1]));
}

export default {
  async list({ nextReq }) {
    const endpoint = '/group_sector/';

    const paramsNextReq = getURLParams({ URL: nextReq });

    const response = await http.get(endpoint, {
      params: { ...paramsNextReq, project: getProject() },
    });

    return response.data;
  },

  async create({ body }) {
    const endpoint = `/group_sector/`;
    const response = await http.post(endpoint, body);

    return response.data;
  },

  async update({ groupUuid, body }) {
    const endpoint = `/group_sector/${groupUuid}/`;
    const response = await http.patch(endpoint, body);

    return response.data;
  },

  async addSector({ groupUuid, sectorUuid }) {
    const endpoint = `/group_sector/${groupUuid}/add_sector/`;
    const response = await http.post(endpoint, { sector: sectorUuid });

    return response.data;
  },

  async removeSector({ groupUuid, sectorUuid }) {
    const endpoint = `/group_sector/${groupUuid}/remove_sector/`;
    const response = await http.post(endpoint, { sector: sectorUuid });

    return response.data;
  },

  async listAuthorization({ groupSectorUuid, role }) {
    const endpoint = `/authorization/group_sector/`;
    const params = { group_sector: groupSectorUuid, role };

    const response = await http.get(endpoint, { params });

    return response.data;
  },

  async addAuthorization({ groupSectorUuid, permissionUuid, role }) {
    const endpoint = `/authorization/group_sector/`;
    const body = {
      role,
      permission: permissionUuid,
      group_sector: groupSectorUuid,
    };

    const response = await http.post(endpoint, body);

    return response.data;
  },
  async deleteAuthorization({ permissionUuid }) {
    const endpoint = `/authorization/group_sector/${permissionUuid}`;

    const response = await http.delete(endpoint);

    return response.data;
  },
};
