import http from '@/services/api/http';

const DEFAULT_STATUSES = [
  { value: 'active', label: 'Online', color: 'green', statusUuid: null },
  { value: 'inactive', label: 'Offline', color: 'gray', statusUuid: null },
];

export default {
  async createCustomStatusType({ status }) {
    const response = await http
      .post(`custom_status_type/`, status)
      .then((response) => response.data);
    return response;
  },
  async deleteCustomStatusType({ statusUuid }) {
    const response = http
      .delete(`custom_status_type/${statusUuid}/`)
      .then((response) => response.data);
    return response;
  },

  async getCustomBreakStatusTypeList({ projectUuid }) {
    const response = await http.get(
      `custom_status_type/?project=${projectUuid}`,
    );
    return response.data;
  },

  async getCustomStatusTypeList({ projectUuid }) {
    const response = await http.get(
      `custom_status_type/?project=${projectUuid}`,
    );
    const customStatuses =
      response.data?.results.map((status) => ({
        value: status.uuid,
        label: status.name,
        color: 'brown',
      })) || [];

    return [...DEFAULT_STATUSES, ...customStatuses];
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
        break_time: 0,
      })
      .then((response) => response.data);
    return response;
  },
  async closeCustomStatus({ statusUuid, endTime, isActive }) {
    const response = await http
      .post(`custom_status/${statusUuid}/close_status/`, {
        end_time: endTime,
        is_active: isActive,
      })
      .then((response) => response.data);

    return response;
  },
  async getActiveCustomStatus() {
    const response = await http.get(`custom_status/last_status`);
    return response.data;
  },
};
