import http from '@/services/api/http';

const PROJECT_ID = '34a93b52-231e-11ed-861d-0242ac120002';

export default {
  async list() {
    const response = await http.get('/sector/', {
      params: { project: PROJECT_ID },
    });
    return response.data;
  },

  async find(uuid) {
    const response = await http.get(`/sector/${uuid}`);
    return response.data;
  },

  async create(props) {
    const response = await http.post('/sector/', { ...props, project: PROJECT_ID });
    return response.data;
  },

  async addManager(sectorUuid, managerUuid) {
    await http.post('/authorization/sector/', {
      role: 1, // manager
      sector: sectorUuid,
      permission: managerUuid,
    });
  },

  async addTag(sectorUuid, tagName) {
    const response = await http.post('/tag/', {
      sector: sectorUuid,
      name: tagName,
    });

    return response.data;
  },

  async tags(sectorUuid) {
    const response = await http.get('/tag/', { params: { sector: sectorUuid } });
    return response.data;
  },
};
