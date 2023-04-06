import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getRoomInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`/dashboard/${idProject}/general/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getProjectInfo() {
    const idProject = getProject();
    const response = await http.get(`/project/${idProject}/`);
    return response;
  },
  async getAgentInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/agent/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getSectorInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/division/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        // tag: 'osh',
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getRawInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/raw_data/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        // tag: 'osh',
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
};
