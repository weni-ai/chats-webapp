import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getRoomInfo(idSector, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`/dashboard/${idProject}/general/`, {
      params: {
        sector: idSector,
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
  async getAgentInfo(idSector, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/agent/`, {
      params: {
        sector: idSector,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getSectorInfo(idSector, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/division/`, {
      params: {
        sector: idSector,
        // sector: '28c4e59e-36bd-4a73-9581-0c35ed268e27',
        tag,
        // tag: 'osh',
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
};
