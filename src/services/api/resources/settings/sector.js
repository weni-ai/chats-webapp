import http from '@/services/api/http';

import { useProfile } from '@/store/modules/profile';

import { getProject } from '@/utils/config';
import { asyncTimeout } from '@/utils/time';

function getURLParams({ URL, endpoint }) {
  return URL?.split(endpoint)?.[1];
}

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

  async tags(sectorUuid) {
    const response = await http.get('/tag/', {
      params: { sector: sectorUuid, limit: 9999 },
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
    // const response = await http.get(`/sector/${sectorUuid}/worktime/`);

    const response = {
      data: {
        working_hours: {
          schedules: {
            monday: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '18:00' },
            ],
            tuesday: [{ start: '08:00', end: '12:00' }],
            sunday: null,
          },
        },
      },
    };

    await asyncTimeout(1000);

    return response.data;
  },

  async getCountryHolidays() {
    // const response = await http.get('/sector_holidays/official_holidays/');
    const response = {
      data: {
        country_code: 'BR',
        year: 2025,
        holidays: [
          {
            date: '2024-01-01',
            name: 'Confraternização Universal',
            country_code: 'BR',
          },
          {
            date: '2024-04-21',
            name: 'Tiradentes',
            country_code: 'BR',
          },
          {
            date: '2024-02-13',
            name: 'Carnaval',
            country_code: 'BR',
          },
        ],
      },
    };
    await asyncTimeout(1000);
    return response.data;
  },

  async getAllSectorHolidays(sector) {
    // const response = await http.get('/sector_holiday/', {
    //   params: {
    //     sector,
    //   },
    // });

    const response = {
      data: [
        {
          uuid: 'uuid-do-feriado-1',
          date: '2024-01-01',
          day_type: 'closed',
          start_time: null,
          end_time: null,
          description: 'feriado na minha rua',
          its_custom: true,
        },
        {
          uuid: 'uuid-do-feriado-2',
          date: '2024-02-13',
          day_type: 'custom_hours',
          start_time: '08:00:00',
          end_time: '12:00:00',
          description: 'Carnaval - Horário Reduzido',
          its_custom: false,
          disabled_open_room: true,
        },
      ],
    };
    await asyncTimeout(1000);
    return response.data;
  },

  async createCountryHolidays(sector, { enabled_holidays, disabled_holidays }) {
    const response = await http.post(
      '/sector_holiday/import_official_holidays/',
      { enabled_holidays, disabled_holidays },
      { params: { sector } },
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
