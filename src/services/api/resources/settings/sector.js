import http from '@/services/api/http';

import { useProfile } from '@/store/modules/profile';

import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

export default {
  async list({ nextReq, limit, offset } = {}) {
    const endpoint = '/sector/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = { project: getProject(), limit, offset };

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

  async managers(sectorUuid, offset, limit) {
    const response = await http.get('/authorization/sector/', {
      params: {
        sector: sectorUuid,
        limit,
        offset,
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
    await http.delete(`/authorization/sector/${managerUuid}/`);
  },

  async tags(sectorUuid, { limit = 20, next = '' }) {
    const endpoint = '/tag/';
    const nextParams = next
      ? getURLParams({ URL: next, endpoint, returnObject: true })
      : {};

    const params = {
      ...nextParams,
      sector: sectorUuid,
      limit: nextParams.limit || limit,
    };

    const response = await http.get(endpoint, {
      params,
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

  async getWorkingTimes(sectorUuid) {
    const response = await http.get(`/sector/${sectorUuid}/worktime/`);

    return response.data;
  },

  async getCountryHolidays() {
    const response = await http.get('/sector_holiday/official_holidays/', {
      params: { project: getProject() },
    });

    return response.data;
  },

  async getAllSectorHolidays(sector) {
    const response = await http.get('/sector_holiday/', {
      params: {
        sector,
        limit: 9999,
      },
    });

    return response.data?.results || [];
  },

  async createCountryHolidays(sector, { enabled_holidays, disabled_holidays }) {
    const response = await http.post(
      '/sector_holiday/import_official_holidays/',
      { enabled_holidays, disabled_holidays, sector },
    );
    return response.data;
  },

  async updateCountryHoliday(sector, { enabled_holidays, disabled_holidays }) {
    const response = await http.patch(
      `/sector_holiday/official_holidays/`,
      {
        enabled_holidays,
        disabled_holidays,
      },
      { params: { sector } },
    );
    return response.data;
  },

  async createSectorHoliday(sector, holiday) {
    const body = {
      ...holiday,
      sector,
      day_type: 'closed',
      start_time: null,
      end_time: null,
      description: '',
      its_custom: true,
    };
    const response = await http.post('/sector_holiday/', body);
    return response.data;
  },

  async deleteSectorHoliday(sector, holidayId) {
    const response = await http.delete(`/sector_holiday/${holidayId}/`, {
      params: { sector },
    });
    return response.data;
  },

  async setSectorWorkingDays(sector, workingDays) {
    const response = await http.post(`/sector/${sector}/worktime/`, {
      working_hours: {
        schedules: workingDays,
      },
    });
    return response.data;
  },
};
