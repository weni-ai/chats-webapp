import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async list() {
    const response = await http.get('/sector/', {
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
    const response = await http.post('/sector/', { ...props, project: getProject() });
    return response.data;
  },

  async update(uuid, data) {
    const sector = await http.patch(`/sector/${uuid}/`, data);
    return sector;
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

  async tags(sectorUuid) {
    const response = await http.get('/tag/', { params: { sector: sectorUuid } });
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
