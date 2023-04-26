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
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async downloadMetricData(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/export/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    if (response.status === 200) {
      const { headers } = response;
      const blob = new Blob([response.data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'download metric';
      link.click();
    }
    // return response.data;
  },
  async downloadAllData(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/export_dashboard/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    if (response.status === 200) {
      const { headers } = response;
      console.log(response, `oi`);
      const blob = new Blob([response.data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'download all';
      link.click();
    }
    // return response.data;
  },
};
