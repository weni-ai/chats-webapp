import http from '@/services/api/http';

export default {
  async createCustomStatusType({ name, projectUuid }) {
    const response = await http
      .post(`custom_status_type/`, {
        name,
        project: projectUuid,
      })
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },
  async deleteCustomStatusType({ statusUuid }) {
    const response = http.delete(`custom_status_type/${statusUuid}/`);
    return response.data;
  },
  async getCustomStatusTypeList() {
    const response = await http.get(`custom_status_type`);
    return response.data;
  },
  async getCustomStatusType({ statusUuid }) {
    const response = await http.get(`custom_status_type/${statusUuid}/`);
    return response.data;
  },
  async createCustomStatus({ email, statusType }) {
    const response = await http
      .post(`custom_status/`, {
        user: email,
        status_type: statusType,
      })
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },
  async CloseCustomStatus({ statusUuid, endTime }) {
    const response = http
      .post(`custom_status/${statusUuid}/close_status`, {
        end_time: endTime,
      })
      .then((response) => response.data)
      .catch((error) => error.response);

    return response;
  },
  async getActiveCustomStatus() {
    const response = await http.get(`custom_status/last_status`);
    return response.data;
  },
};
