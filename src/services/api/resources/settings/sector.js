import http from '@/services/api/http';

import { useProfile } from '@/store/modules/profile';

import { getProject } from '@/utils/config';

function getURLParams({ URL, endpoint }) {
  return URL?.split(endpoint)?.[1];
}

export default {
  async list({ nextReq, limit } = {}) {
    const endpoint = '/sector/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = { project: getProject(), limit };

    let response;

    if (nextReq && paramsNextReq) {
      response = await http.get(`${endpoint}${paramsNextReq}`);
    } else {
      response = await http.get(endpoint, { params });
    }

    return response.data;
  },

  async countOfSectorsAvaible() {
    const response = await http.get('/sector/count/', {
      params: { project: getProject() },
    });
    return response.data;
  },

  async find(uuid) {
    const response = await http.get(`/sector/${uuid}/`);
    return response.data;
  },

  async agents({ sectorUuid }) {
    const response = await http.get(`/sector/${sectorUuid}/agents/`);
    return response.data;
  },

  async create(props) {
    const response = await http.post('/sector/', {
      ...props,
      project: getProject(),
    });
    return response.data;
  },

  async update(uuid, data) {
    const response = await http
      .patch(`/sector/${uuid}/`, data)
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },

  async deleteSector(sectorUuid) {
    const profileStore = useProfile();
    const { me } = profileStore;
    const response = await http.delete(
      `/sector/${sectorUuid}/?user=${me?.email}`,
    );
    return response.data;
  },

  async managers(sectorUuid) {
    const response = await http.get('/authorization/sector/', {
      params: {
        sector: sectorUuid,
      },
    });
    return response.data;
  },

  async addManager(sectorUuid, managerUuid) {
    await http.post('/authorization/sector/', {
      role: 1, // manager
      sector: sectorUuid,
      permission: managerUuid,
    });
  },
  async removeManager(managerUuid) {
    await http.delete(`/authorization/sector/${managerUuid}`);
  },

  async tags(sectorUuid) {
    const response = await http.get('/tag/', {
      params: { sector: sectorUuid },
    });
    return response.data;
  },

  async addTag(sectorUuid, tagName) {
    const response = await http.post('/tag/', {
      sector: sectorUuid,
      name: tagName,
    });

    return response.data;
  },

  async removeTag(tagUuid) {
    await http.delete(`/tag/${tagUuid}/`);
  },
};
